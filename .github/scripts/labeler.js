const { context, getOctokit } = require("@actions/github");

async function applyLabels(octokit, owner, repo, pull_number, labels) {
  // Fetching the color for each label, you can customize this based on your requirements
  const labelColors = {
    "javascript-file": "FFD700", // Example color for the 'javascript-file' label (hex format)
    // Add more label-color pairs as needed
  };

  const labelsWithColors = labels.map((label) => ({
    name: label,
    color: labelColors[label] || "000000", // Default to black if no color is specified
  }));

  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: pull_number,
    labels: labelsWithColors,
  });
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
      labelsToApply.push("javascript-file");
    }
    // Add more conditions as needed
  }

  if (labelsToApply.length > 0) {
    await applyLabels(octokit, owner, repo, pull_number, labelsToApply);
    console.log(`Labels applied: ${labelsToApply.join(", ")}`);
  } else {
    console.log("No labels to apply.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
