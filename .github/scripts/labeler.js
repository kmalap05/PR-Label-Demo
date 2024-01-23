const { context, getOctokit } = require("@actions/github");

async function run() {
  const token = process.env.GITHUB_TOKEN;
  const octokit = getOctokit(token);

  const prNumber = context.payload.pull_request.number;
  const prDescription = context.payload.pull_request.body.toLowerCase();

  let labelsToAdd = [];

  // Example: Check for keywords in the description
  if (prDescription.includes("bug")) {
    labelsToAdd.push("bug");
  }
  if (prDescription.includes("feature")) {
    labelsToAdd.push("feature");
  }

  // Add labels to the pull request
  await octokit.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    labels: labelsToAdd,
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
