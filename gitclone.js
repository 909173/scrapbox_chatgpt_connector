const git = require("simple-git");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

async function cloneRepo(gitURL, targetFolder) {
  try {
    await git().clone(gitURL, targetFolder);
  } catch (err) {
    console.error("Error cloning repo:", err);
  }
}

async function convertFilesToJson(targetFolder, outputPath, allowedExtensions) {
  let filesAndFolders = fs
    .readdirSync(targetFolder)
    .map((item) => path.join(targetFolder, item));

  let fileObjects = [];
  while (filesAndFolders.length > 0) {
    const itemPath = filesAndFolders.shift();
    const fileExtension = itemPath.split(".").pop();
    if (fs.lstatSync(itemPath).isDirectory()) {
      filesAndFolders = filesAndFolders.concat(
        fs.readdirSync(itemPath).map((item) => {
          const joinedPath = path.join(itemPath, item);
          return joinedPath;
        })
      );
    } else if (allowedExtensions.includes(fileExtension)) {
      const fileStream = fs.createReadStream(itemPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let lines = [];
      for await (const line of rl) {
        lines.push(line);
      }

      fileObjects.push({
        title: itemPath,
        lines: lines,
      });
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify({ pages: fileObjects }));
}

(async () => {
  const gitURL = "https://github.com/mastodon/documentation.git";
  const targetFolder = "./git-repository";
  const outputPath = "./from_scrapbox/export-mastodon.json";
  const allowedExtensions = [
    "txt",
    "md",
    "csv",
    "json",
    "ts",
    "html",
    "css",
    "js",
  ];
  // await cloneRepo(gitURL, targetFolder);
  await convertFilesToJson(targetFolder, outputPath, allowedExtensions);
})();
