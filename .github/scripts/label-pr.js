// labeler.js
const labeler = require("labeler");

labeler({
  repoPath: process.env.GITHUB_WORKSPACE,
  templatePath: ".github/PULL_REQUEST_TEMPLATE.md",
  labelsPath: ".github/labeler-config.yml",
});
const axios = require("axios");

async function getPullRequestInfo(prNumber) {
  const response = await axios.get(
    `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/${prNumber}`
  );
  return response.data;
}

async function addLabelsToPullRequest(prNumber, labels) {
  await axios.post(
    `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${prNumber}/labels`,
    {
      labels: labels,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
      },
    }
  );
}

async function run() {
  const prNumber = process.argv[2];
  const prInfo = await getPullRequestInfo(prNumber);

  // Extract information from the pull request
  const description = prInfo.body;
  const selectedType = description.includes("[x] Feature")
    ? "Feature"
    : "Other";

  // Get list of modified files
  const modifiedFilesCommand = `git diff --name-only HEAD^ HEAD`;
  const modifiedFiles = require("child_process")
    .execSync(modifiedFilesCommand, { encoding: "utf-8" })
    .split("\n")
    .filter(Boolean);

  // Assign labels based on selections and file extensions
  const labelsToAssign = [selectedType];

  for (const file of modifiedFiles) {
    if (file.endsWith(".js")) {
      labelsToAssign.push("JavaScript");
    }
  }

  // Output the labels
  console.log(labelsToAssign.join(","));

  // Add labels to the pull request
  await addLabelsToPullRequest(prNumber, labelsToAssign);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
