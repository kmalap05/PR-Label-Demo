const { context, getOctokit } = require("@actions/github");

async function applyLabels(octokit, owner, repo, pullNumber, labels) {
  for (const label of labels) {
    try {
      const existingLabel = await octokit.rest.issues.getLabel({
        owner,
        repo,
        name: label.name,
      });

      if (existingLabel.color === label.color) {
        await octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number: pullNumber,
          labels: [label.name],
        });
      } else {
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
        throw error;
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
  const { owner, repo, number: pullNumber } = context.issue;

  console.log(`Repository: ${owner}/${repo}, Pull Request: ${pullNumber}`);

  if (action === "opened") {
    if (context.payload.pull_request) {
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

      if (fileLabelsToApply.length > 0) {
        await applyLabels(octokit, owner, repo, pullNumber, fileLabelsToApply);
        console.log(
          `File Labels applied: ${fileLabelsToApply
            .map((label) => label.name)
            .join(", ")}`
        );
      } else {
        console.log("No file labels to apply.");
      }

      // Label based on pull request description
      const pullRequest = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });

      const description = pullRequest.data.body || "";
      const pullRequestDescriptionLabelsToApply = [];

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

      if (pullRequestDescriptionLabelsToApply.length > 0) {
        await applyLabels(
          octokit,
          owner,
          repo,
          pullNumber,
          pullRequestDescriptionLabelsToApply
        );
        console.log(
          `Description Labels applied: ${pullRequestDescriptionLabelsToApply
            .map((label) => label.name)
            .join(", ")}`
        );
      } else {
        console.log("No description labels to apply.");
      }
    } else if (context.payload.issue) {
      // Label based on issue title and description
      if (context.payload.issue) {
        const issueNumber = context.payload.issue.number;
        const issue = await octokit.rest.issues.get({
          owner,
          repo,
          issue_number: issueNumber,
        });

        // Extract labels from the issue title and description
        const titleLabelsToApply = [];
        const issueDescriptionLabelsToApply = [];

        if (issue.data.title.includes("[BUG]")) {
          titleLabelsToApply.push({ name: "Bug", color: "YourBugColor" });
        } else if (issue.data.title.includes("[FEATURE]")) {
          titleLabelsToApply.push({
            name: "Feature",
            color: "YourFeatureColor",
          });
        }

        if (issue.data.body.includes(".js")) {
          issueDescriptionLabelsToApply.push({
            name: "JavaScript",
            color: "YourJavaScriptColor",
          });
        }

        if (issue.data.body.includes(".css")) {
          issueDescriptionLabelsToApply.push({
            name: "CSS",
            color: "YourCSSColor",
          });
        }

        if (issue.data.body.includes(".yml")) {
          issueDescriptionLabelsToApply.push({
            name: "YAML",
            color: "YourYAMLColor",
          });
        }

        if (titleLabelsToApply.length > 0) {
          await applyLabels(
            octokit,
            owner,
            repo,
            issueNumber,
            titleLabelsToApply
          );
          console.log(
            `Title Labels applied: ${titleLabelsToApply
              .map((label) => label.name)
              .join(", ")}`
          );
        } else {
          console.log("No title labels to apply.");
        }

        if (issueDescriptionLabelsToApply.length > 0) {
          await applyLabels(
            octokit,
            owner,
            repo,
            issueNumber,
            issueDescriptionLabelsToApply
          );
          console.log(
            `Description Labels applied: ${issueDescriptionLabelsToApply
              .map((label) => label.name)
              .join(", ")}`
          );
        } else {
          console.log("No description labels to apply.");
        }
      }
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
