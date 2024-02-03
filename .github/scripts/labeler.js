const { context, getOctokit } = require("@actions/github");

async function labelExists(octokit, owner, repo, labelName, labelColor) {
  try {
    const existingLabel = await octokit.rest.issues.getLabel({
      owner,
      repo,
      name: labelName,
    });

    return existingLabel.color.toLowerCase() === labelColor.toLowerCase();
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
    const exists = await labelExists(
      octokit,
      owner,
      repo,
      label.name,
      label.color
    );

    if (!exists) {
      // Label with the same name doesn't exist or has a different color, update or create it
      await octokit.rest.issues.createLabel({
        owner,
        repo,
        name: label.name,
        color: label.color,
      });
    }

    // Add the label to the issue
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
      // Change the color of the label as needed
      const labelColor = "00ff00";

      labelsToApply.push({
        name: "javascript-file",
        color: labelColor,
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
