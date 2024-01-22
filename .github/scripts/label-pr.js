// labeler.js
const labeler = require("labeler");

labeler({
  repoPath: process.env.GITHUB_WORKSPACE,
  templatePath: ".github/PULL_REQUEST_TEMPLATE.md",
  labelsPath: ".github/labeler-config.yml",
});
