// .github/scripts/pr-labeling.js

const { Octokit } = require("@octokit/rest");
const fs = require("fs").promises;

const octokit = new Octokit();

async function run() {
  try {
    // Get PR details
    const prNumber = process.env.GITHUB_EVENT_NUMBER;
    const pr = await octokit.pulls.get({
      owner: process.env.GITHUB_REPOSITORY.split("/")[0],
      repo: process.env.GITHUB_REPOSITORY.split("/")[1],
      pull_number: prNumber,
    });

    // Read template and get label selections
    const template = pr.data.body;
    const labelMatches = template.match(/- \[x\] (.*)/g);

    if (!labelMatches) {
      console.log("No label selections found in the template.");
      return;
    }

    const labelSelections = template
      .match(/- \[x\] (.*)/g)
      .map((label) => label.split(" ")[2]);

    // Get modified files
    const files = await octokit.pulls.listFiles({
      owner: process.env.GITHUB_REPOSITORY.split("/")[0],
      repo: process.env.GITHUB_REPOSITORY.split("/")[1],
      pull_number: prNumber,
    });

    // Extract file extensions and apply corresponding labels
    const fileExtensions = files.data.map((file) =>
      file.filename.split(".").pop()
    );

    // Read configuration file
    const configFile =
      process.env.CONFIG_FILE || ".github/labeling-config.json";
    const config = JSON.parse(await fs.readFile(configFile, "utf-8"));

    // Filter out ignored patterns
    const filteredExtensions = fileExtensions.filter(
      (ext) =>
        labelSelections.includes(ext) &&
        !config.ignorePatterns.some((pattern) => ext.match(new RegExp(pattern)))
    );

    // Apply labels to the PR
    await octokit.issues.addLabels({
      owner: process.env.GITHUB_REPOSITORY.split("/")[0],
      repo: process.env.GITHUB_REPOSITORY.split("/")[1],
      issue_number: prNumber,
      labels: filteredExtensions,
    });

    console.log("Labels applied:", filteredExtensions);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

run();
