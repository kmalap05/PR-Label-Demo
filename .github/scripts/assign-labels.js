const { context, GitHub } = require("@actions/github");
const yaml = require("js-yaml");
const fs = require("fs");

async function run() {
  const config = yaml.safeLoad(fs.readFileSync(".labeling-config.yml", "utf8"));
  const prNumber = context.payload.pull_request.number;
  const files = await getModifiedFiles(prNumber);

  const excludedFiles = files.filter((file) =>
    isExcluded(file, config.exclusions)
  );

  // Extract labels from the dropdown selections in the PR template
  const prTemplate = await getPRTemplate(prNumber);
  const selectedLabels = extractDropdownLabels(prTemplate);

  // Apply labels based on dropdown selections and excluded files
  const octokit = new GitHub(process.env.GITHUB_TOKEN);
  await octokit.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    labels: selectedLabels.concat(
      excludedFiles.map((file) => `exclude-${file}`)
    ),
  });
}

async function getPRTemplate(prNumber) {
  const octokit = new GitHub(process.env.GITHUB_TOKEN);
  const response = await octokit.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });
  return response.data.body;
}

function extractDropdownLabels(prTemplate) {
  // Extract labels from the dropdown section in the PR template
  const dropdownMatch = prTemplate.match(
    /## Type of Change\n\n([\s\S]+?)<details>/
  );
  if (dropdownMatch) {
    const dropdownContent = dropdownMatch[1];
    const selectedLabels = dropdownContent.match(/\[x\] (.+)/g);
    return selectedLabels ? selectedLabels.map((label) => label.slice(4)) : [];
  }
  return [];
}

async function getModifiedFiles(prNumber) {
  const octokit = new GitHub(process.env.GITHUB_TOKEN);
  const response = await octokit.pulls.listFiles({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });
  return response.data.map((file) => file.filename);
}

function isExcluded(file, exclusions) {
  return exclusions.some((exclusion) => {
    const regex = new RegExp(`^${exclusion.path.replace(/\*/g, ".*")}$`);
    return exclusion.type === "pattern"
      ? regex.test(file)
      : exclusion.type === "directory"
      ? file.startsWith(exclusion.path)
      : file === exclusion.path;
  });
}

run();
