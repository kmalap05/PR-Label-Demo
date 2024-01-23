const { execSync } = require("child_process");
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

function addLabel(prNumber, label) {
  octokit.issues.addLabels({
    owner: process.env.GITHUB_REPOSITORY.split("/")[0],
    repo: process.env.GITHUB_REPOSITORY.split("/")[1],
    issue_number: prNumber,
    labels: [label],
  });
  console.log(`Label '${label}' added to PR #${prNumber}`);
}

async function main() {
  const prNumber = process.env.GITHUB_EVENT_NUMBER;
  const pr = await octokit.pulls.get({
    owner: process.env.GITHUB_REPOSITORY.split("/")[0],
    repo: process.env.GITHUB_REPOSITORY.split("/")[1],
    pull_number: prNumber,
  });
  const prBody = pr.data.body;
  const modifiedFiles = execSync(
    "git diff --name-only $(git merge-base origin/main HEAD)",
    { encoding: "utf-8" }
  ).split("\n");

  // Add your own logic to determine label based on PR body or modified files
  if (prBody.includes("keyword1") || prBody.includes("keyword2")) {
    addLabel(prNumber, "label1");
  }

  if (modifiedFiles.some((file) => file.endsWith(".js"))) {
    addLabel(prNumber, "javascript-changes");
  }
}

main();
