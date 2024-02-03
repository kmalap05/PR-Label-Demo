const { context, getOctokit } = require("@actions/github");

/**
 * Apply labels to a pull request based on specified conditions.
 *
 * @param {Object} octokit - Octokit instance
 * @param {string} owner - Owner of the repository
 * @param {string} repo - Repository name
 * @param {number} pullNumber - Pull request number
 * @param {Array} labels - Array of labels to apply
 */
async function applyLabels(octokit, owner, repo, pullNumber, labels) {
  for (const label of labels) {
    try {
      // Check if the label already exists
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
          issue_number: pullNumber,
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
          issue_number: pullNumber,
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
          issue_number: pullNumber,
          labels: [label.name],
        });
      } else {
        throw error; // Other errors
      }
    }
  }
}

/**
 * Main function to apply labels based on changed files in a pull request.
 */
async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not set.");
  }

  const octokit = getOctokit(token);
  const { owner, repo, number: pullNumber } = context.issue;

  console.log(`Repository: ${owner}/${repo}, Pull Request: ${pullNumber}`);

  const changedFiles = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });

  const labelsToApply = [];

  for (const file of changedFiles.data) {
    if (file.filename.endsWith(".js")) {
      labelsToApply.push({
        name: "javascript-file",
        color: "00ff00",
      });
    }
  }

  if (labelsToApply.length > 0) {
    await applyLabels(octokit, owner, repo, pullNumber, labelsToApply);
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
