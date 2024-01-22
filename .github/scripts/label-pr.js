const { GitHub, context } = require("@actions/github");

async function run() {
  const token = process.env.GITHUB_TOKEN;
  const client = new GitHub(token);

  const prNumber = context.payload.pull_request.number;
  const prFiles = await getPRFiles(client, prNumber);

  // Your label logic based on file extensions goes here

  // Example: Label PR with "js" label if a ".js" file is modified
  if (prFiles.some((file) => file.endsWith(".js"))) {
    await addLabel(client, prNumber, "js");
  }
}

async function getPRFiles(client, prNumber) {
  const response = await client.pulls.listFiles({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  return response.data.map((file) => file.filename);
}

async function addLabel(client, prNumber, label) {
  await client.issues.addLabels({
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
