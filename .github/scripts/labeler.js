const { context, getOctokit } = require("@actions/github");

async function run() {
  const token = process.env.GH_TOKEN;
  const octokit = getOctokit(token);

  const prNumber = context.payload.pull_request.number;
  const prDescription = context.payload.pull_request.body;

  // Logic to analyze prDescription and determine labels
  let labelsToAdd = [];
  // Example: If the description contains 'bug', add 'bug' label
  if (prDescription.toLowerCase().includes("bug")) {
    labelsToAdd.push("bug");
  }

  // Apply labels to the pull request
  await octokit.rest.issues.addLabels({
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
