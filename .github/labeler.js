const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  try {
    const prFiles = await getChangedFiles();
    const labels = getLabelsFromFiles(prFiles);

    if (labels.length > 0) {
      await addLabels(labels);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getChangedFiles() {
  const client = github.getOctokit(process.env.GITHUB_TOKEN);

  const prNumber = github.context.payload.pull_request.number;
  const response = await client.pulls.listFiles({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
  });

  return response.data.map((file) => file.filename);
}

function getLabelsFromFiles(files) {
  const labelMap = {
    ".js": "javascript",
    // Add more file extensions and corresponding labels as needed
  };

  const excludedFiles = [
    "exclude.js", // Add files to be excluded
  ];

  const labels = [];

  files.forEach((file) => {
    const extension = file.split(".").pop();
    if (labelMap[extension] && !excludedFiles.includes(file)) {
      labels.push(labelMap[extension]);
    }
  });

  return labels;
}

async function addLabels(labels) {
  const client = github.getOctokit(process.env.GITHUB_TOKEN);

  const prNumber = github.context.payload.pull_request.number;

  await client.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    labels: labels,
  });
}

run();
