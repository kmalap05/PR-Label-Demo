const { context, getOctokit } = require("@actions/github");

async function run() {
  const token = process.env.GITHUB_TOKEN;
  const octokit = getOctokit(token);

  const prNumber = context.payload.pull_request.number;
  const prFiles = await getPRFiles(octokit, prNumber);

  // Your label logic based on file extensions goes here

  // Example: Label PR with "js" label if a ".js" file is modified
  if (prFiles.some((file) => file.endsWith(".js"))) {
    await addLabel(octokit, prNumber, "js");
  }
}

async function getPRFiles(octokit, prNumber) {
  const response = await octokit.pulls.listFiles({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  return response.data.map((file) => file.filename);
}

async function addLabel(octokit, prNumber, label) {
  await octokit.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    labels: [label],
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
