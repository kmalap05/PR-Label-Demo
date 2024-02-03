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
        name: "javascript-file",
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
  const descriptionLabelsToApply = [];

  if (description.includes("[x] Feature")) {
    descriptionLabelsToApply.push({
      name: "Feature",
      color: "YourFeatureColor",
    });
  }

  if (description.includes("[x] Bug Fix")) {
    descriptionLabelsToApply.push({
      name: "Bug Fix",
      color: "YourBugFixColor",
    });
  }

  if (description.includes("[x] Documentation")) {
    descriptionLabelsToApply.push({
      name: "Documentation",
      color: "YourDocumentationColor",
    });
  }

  if (description.includes("[x] Other")) {
    descriptionLabelsToApply.push({ name: "Other", color: "YourOtherColor" });
  }

  if (descriptionLabelsToApply.length > 0) {
    await applyLabels(
      octokit,
      owner,
      repo,
      pullNumber,
      descriptionLabelsToApply
    );
    console.log(
      `Description Labels applied: ${descriptionLabelsToApply
        .map((label) => label.name)
        .join(", ")}`
    );
  } else {
    console.log("No description labels to apply.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
