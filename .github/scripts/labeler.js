const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({ auth: process.env.GH_TOKEN });

async function run() {
  const prNumber = process.env.GITHUB_PR_NUMBER;
  const pr = await octokit.pulls.get({
    owner: process.env.GITHUB_REPOSITORY_OWNER,
    repo: process.env.GITHUB_REPOSITORY,
    pull_number: prNumber,
  });

  const prBody = pr.data.body;

  // Add logic to parse PR template and assign labels based on dropdown selections

  // Example: Check if the PR body contains a specific keyword and add a label
  if (prBody.includes("label: bug")) {
    await octokit.issues.addLabels({
      owner: process.env.GITHUB_REPOSITORY_OWNER,
      repo: process.env.GITHUB_REPOSITORY,
      issue_number: prNumber,
      labels: ["bug"],
    });
  }

  const prFiles = await octokit.pulls.listFiles({
    owner: process.env.GITHUB_REPOSITORY_OWNER,
    repo: process.env.GITHUB_REPOSITORY,
    pull_number: prNumber,
  });

  for (const file of prFiles.data) {
    // Add logic to extract file extension and assign labels accordingly
    const fileExtension = file.filename.split(".").pop();

    // Example: Assign a label based on the file extension
    switch (fileExtension) {
      case "js":
        await octokit.issues.addLabels({
          owner: process.env.GITHUB_REPOSITORY_OWNER,
          repo: process.env.GITHUB_REPOSITORY,
          issue_number: prNumber,
          labels: ["js"],
        });
        break;
      case "css":
        await octokit.issues.addLabels({
          owner: process.env.GITHUB_REPOSITORY_OWNER,
          repo: process.env.GITHUB_REPOSITORY,
          issue_number: prNumber,
          labels: ["css"],
        });
        break;
      // Add more cases for other file extensions as needed
    }
  }
}

run();
