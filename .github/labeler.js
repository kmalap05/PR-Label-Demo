const { execSync } = require("child_process");
const { GitHub, context } = require("@actions/github");

const octokit = new GitHub(process.env.GITHUB_TOKEN);

function addLabel(prNumber, label) {
  octokit.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    labels: [label],
  });
  console.log(`Label '${label}' added to PR #${prNumber}`);
}

async function main() {
  const prNumber = context.issue.number;
  const pr = await octokit.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
