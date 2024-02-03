const { context, getOctokit } = require("@actions/github");

// Move the labelExists function declaration to the top
// async function labelExists(octokit, owner, repo, labelName) {
//   try {
//     await octokit.rest.issues.getLabel({
//       owner,
//       repo,
//       name: labelName,
//     });
//     return true; // Label exists
//   } catch (error) {
//     if (error.status === 404) {
//       return false; // Label does not exist
//     } else {
//       throw error; // Other errors
//     }
//   }
// }

async function applyLabels(octokit, owner, repo, pull_number, labels) {
  for (const label of labels) {
    try {
      // Check if label exists
      const existingLabel = await octokit.rest.issues.getLabel({
        owner,
        repo,
        name: label.name,
      });

      // If label exists with the same name and same color, just add it
      if (existingLabel.color === label.color) {
        await octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number: pull_number,
          labels: [label.name],
        });
      } else {
        // If label exists with the same name but different color, update it and add
        await octokit.rest.issues.updateLabel({
          owner,
          repo,
          current_name: label.name,
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
    } catch (error) {
      // If label does not exist, create it and add
      if (error.status === 404) {
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
      } else {
        throw error; // Other errors
      }
    }
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
