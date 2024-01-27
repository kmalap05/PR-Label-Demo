const github = require("@actions/github");
const core = require("@actions/core");

async function run() {
  try {
    const pr = github.context.payload.pull_request;
    const labels = [];

    // Add conditions to determine the label based on PR properties
    if (pr.title.includes("bug")) {
      labels.push("bug");
    } else {
      labels.push("feature");
    }

    // Set labels on the pull request
    const octokit = github.getOctokit(core.getInput("github-token"));
    await octokit.rest.issues.addLabels({
      owner: pr.base.repo.owner.login,
      repo: pr.base.repo.name,
      issue_number: pr.number,
      labels: labels,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
