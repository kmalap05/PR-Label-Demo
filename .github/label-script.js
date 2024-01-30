const gitLabel = require("git-label");

const config = {
  api: "https://api.github.com",
  repo: process.env.REPO_FULLNAME,
  token: process.env.GITHUB_TOKEN,
};

const labelsToAdd = [
  { name: "demo12", color: "#fc2929" },
  { name: "demo123", color: "#cccccc" },
];

gitLabel
  .add(config, labelsToAdd)
  .then((result) => {
    console.log("Labels added successfully:", result);
  })
  .catch((error) => {
    console.error("Error adding labels:", error);
  });
