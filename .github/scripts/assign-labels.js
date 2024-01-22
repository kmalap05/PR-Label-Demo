const { context, GitHub } = require("@actions/github");
const fs = require("fs");

async function run() {
  const prNumber = context.payload.pull_request.number;
  const prTemplate = await getPRTemplate(prNumber);

  // Extract labels from the dropdown selections in the PR template
  const selectedLabels = extractDropdownLabels(prTemplate);

  // Apply labels based on dropdown selections
  const octokit = new GitHub(process.env.GITHUB_TOKEN);
  await octokit.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    labels: selectedLabels,
  });
}
//
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
  const dropdownMatch = prTemplate.match(/## Type of Change\n\n([\s\S]+?)\n\n/);
  if (dropdownMatch) {
    const dropdownContent = dropdownMatch[1];
    const selectedLabels = dropdownContent.match(/\[x\] (.+)/g);
    return selectedLabels ? selectedLabels.map((label) => label.slice(4)) : [];
  }
  return [];
}

run();
