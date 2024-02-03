const { context, getOctokit } = require("@actions/github");

// Move the labelExists function declaration to the top
async function labelExists(octokit, owner, repo, labelName) {
  try {
    await octokit.rest.issues.getLabel({
      owner,
      repo,
      name: labelName,
    });
    return true; // Label exists
  } catch (error) {
    if (error.status === 404) {
      return false; // Label does not exist
    } else {
      throw error; // Other errors
    }
  }
}

async function applyLabels(octokit, owner, repo, pull_number, labels) {
  for (const label of labels) {
    const exists = await labelExists(octokit, owner, repo, label.name);

    if (!exists) {
      await octokit.rest.issues.createLabel({
        owner,
        repo,
        name: label.name,
        color: label.color,
      });
    }

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

  const changedFiles = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number,
  });

  const labelsToApply = [];

  for (const file of changedFiles.data) {
    if (file.filename.endsWith(".js")) {
      labelsToApply.push({
        name: "javascript-file",
        color: "ffcc00",
      });
    }
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
