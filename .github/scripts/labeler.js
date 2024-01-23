const axios = require("axios");

async function run() {
  const prNumber = process.env.GITHUB_PR_NUMBER;
  const repoOwner = process.env.GITHUB_REPOSITORY_OWNER;
  const repoName = process.env.GITHUB_REPOSITORY;

  // Get PR details
  const prResponse = await axios.get(
    `https://api.github.com/repos/${repoOwner}/${repoName}/pulls/${prNumber}`
  );
  const prBody = prResponse.data.body;

  // Add logic to parse PR template and assign labels based on dropdown selections

  // Example: Check if the PR body contains a specific keyword and add a label
  if (prBody.includes("label: bug")) {
    // Add label to the PR
    await axios.post(
      `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${prNumber}/labels`,
      {
        labels: ["bug"],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Get modified files in the PR
  const prFilesResponse = await axios.get(
    `https://api.github.com/repos/${repoOwner}/${repoName}/pulls/${prNumber}/files`
  );
  const prFiles = prFilesResponse.data;

  // Add logic to assign labels based on file extensions
  for (const file of prFiles) {
    const fileExtension = file.filename.split(".").pop();

    // Example: Assign a label based on the file extension
    switch (fileExtension) {
      case "js":
        // Add label to the PR
        await axios.post(
          `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${prNumber}/labels`,
          {
            labels: ["js"],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        break;
      case "css":
        // Add label to the PR
        await axios.post(
          `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${prNumber}/labels`,
          {
            labels: ["css"],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        break;
      // Add more cases for other file extensions as needed
    }
  }
}

run();
