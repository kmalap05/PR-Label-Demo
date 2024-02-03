const { context, getOctokit } = require("@actions/github");

async function applyLabels(octokit, owner, repo, pull_number, labels) {
  for (const label of labels) {
    await octokit.rest.issues.createLabel({
      owner,
      repo,
      name: label.name,
      color: label.color,
    });

    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pull_number,
      labels: [label.name],
    });
  }
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not set.");
  }

  const octokit = getOctokit(token);

  const { owner, repo, number: pull_number } = context.issue;

  console.log(owner, repo, pull_number);

  // Add your labeling rules here
  const changedFiles = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number,
  });

  const labelsToApply = [];

  for (const file of changedFiles.data) {
    if (file.filename.endsWith(".js")) {
      // Add the label with color information
      labelsToApply.push({
        name: "javascript-file",
        color: "ffcc00", // Replace with the desired color code
      });
    }
    // Add more conditions as needed
  }

  if (labelsToApply.length > 0) {
    await applyLabels(octokit, owner, repo, pull_number, labelsToApply);
    console.log(
      `Labels applied: ${labelsToApply.map((label) => label.name).join(", ")}`
    );
  } else {
    console.log("No labels to apply.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
