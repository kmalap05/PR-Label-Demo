const { context, getOctokit } = require("@actions/github");

/**
 * Apply labels to an issue or pull request.
 * @param {object} octokit - The Octokit instance.
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @param {number} number - The issue or pull request number.
 * @param {Array} labels - Array of label objects to be applied.
 */
async function applyLabels(octokit, owner, repo, number, labels) {
  for (const label of labels) {
    try {
      const existingLabel = await octokit.rest.issues.getLabel({
        owner,
        repo,
        name: label.name,
      });

      if (existingLabel.color === label.color) {
        // Label exists with the same color
        await octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number: number,
          labels: [label.name],
        });
      } else {
        // Label exists but with a different color
        await octokit.rest.issues.updateLabel({
          owner,
          repo,
          current_name: label.name,
          name: label.name,
          color: label.color,
        });

        // Add the label after updating
        await octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number: number,
          labels: [label.name],
        });
      }
    } catch (error) {
      if (error.status === 404) {
        // Label does not exist, create it and add
        await octokit.rest.issues.createLabel({
          owner,
          repo,
          name: label.name,
          color: label.color,
        });

        // Add the label after creating
        await octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number: number,
          labels: [label.name],
        });
      } else {
        throw error;
      }
    }
  }
}

/**
 * Main function to process the event.
 */
async function main() {
  // Get GitHub token from environment variable
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not set.");
  }

  // Create Octokit instance
  const octokit = getOctokit(token);
  const { owner, repo } = context.repo;
  const { number, action } = context.payload;

  // Log basic information
  console.log(
    `Repository: ${owner}/${repo}, Number: ${number}, Action: ${action}`
  );

  // Check if the event is an 'opened' action
  if (action === "opened") {
    // Check if it's a pull request
    if (context.payload.pull_request) {
      const pullNumber = context.payload.pull_request.number;

      // Label based on changed files
      const changedFiles = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
      });

      const fileLabelsToApply = [];
      for (const file of changedFiles.data) {
        if (file.filename.endsWith(".js")) {
          fileLabelsToApply.push({
            name: "JavaScript 🖥️",
            color: "00ff00",
          });
        } else if (file.filename.endsWith(".css")) {
          fileLabelsToApply.push({
            name: "CSS 🎨",
            color: "00ff00",
          });
        } else if (file.filename.endsWith(".yml")) {
          fileLabelsToApply.push({
            name: "YAML 🔍",
            color: "00ff00",
          });
        }
      }

      // Apply file labels if any
      if (fileLabelsToApply.length > 0) {
        await applyLabels(octokit, owner, repo, pullNumber, fileLabelsToApply);
      }

      // Label based on pull request description
      const pullRequest = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });

      const description = pullRequest.data.body || "";
      const pullRequestDescriptionLabelsToApply = [];

      // Check for specific keywords in description
      if (description.includes("[x] Feature")) {
        pullRequestDescriptionLabelsToApply.push({
          name: "Feature 🌟",
          color: "ff0000",
        });
      }

      if (description.includes("[x] Bug Fix")) {
        pullRequestDescriptionLabelsToApply.push({
          name: "Bugfix! 🎉",
          color: "ff0000",
        });
      }

      if (description.includes("[x] Documentation")) {
        pullRequestDescriptionLabelsToApply.push({
          name: "Documentation 📝",
          color: "ff0000",
        });
      }

      if (description.includes("[x] Other")) {
        pullRequestDescriptionLabelsToApply.push({
          name: "Other 🔄",
          color: "ff0000",
        });
      }

      // Apply description labels if any
      if (pullRequestDescriptionLabelsToApply.length > 0) {
        await applyLabels(
          octokit,
          owner,
          repo,
          pullNumber,
          pullRequestDescriptionLabelsToApply
        );
      }
    } else if (context.payload.issue) {
      // It's a new issue
      const issueNumber = context.payload.issue.number;

      // Extract labels from the issue title and description
      const titleLabelsToApply = [];
      const issueDescriptionLabelsToApply = [];

      if (context.payload.issue.title.includes("[BUG]")) {
        titleLabelsToApply.push({ name: "Bug 🐞", color: "ff0000" });
      } else if (context.payload.issue.title.includes("[FEATURE]")) {
        titleLabelsToApply.push({
          name: "Feature 🌟",
          color: "ff0000",
        });
      }

      if (context.payload.issue.body.includes(".js")) {
        issueDescriptionLabelsToApply.push({
          name: "JavaScript 🖥️",
          color: "00ff00",
        });
      }

      if (context.payload.issue.body.includes(".css")) {
        issueDescriptionLabelsToApply.push({
          name: "CSS 🎨",
          color: "00ff00",
        });
      }

      if (context.payload.issue.body.includes(".yml")) {
        issueDescriptionLabelsToApply.push({
          name: "YAML 🔍",
          color: "00ff00",
        });
      }

      // Apply title labels if any
      if (titleLabelsToApply.length > 0) {
        await applyLabels(
          octokit,
          owner,
          repo,
          issueNumber,
          titleLabelsToApply
        );
      }

      // Apply description labels if any
      if (issueDescriptionLabelsToApply.length > 0) {
        await applyLabels(
          octokit,
          owner,
          repo,
          issueNumber,
          issueDescriptionLabelsToApply
        );
      }
    }
  }
}

// Execute the main function
main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
