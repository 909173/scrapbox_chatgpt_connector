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

async function convertFilesToPlainText(
  targetFolder,
  outputPath,
  allowedExtensions
) {
  let filesAndFolders = fs
    .readdirSync(targetFolder)
    .map((item) => path.join(targetFolder, item));

  let combinedText = "";
  while (filesAndFolders.length > 0) {
    const itemPath = filesAndFolders.shift();
    const fileExtension = itemPath.split(".").pop();
    if (fs.lstatSync(itemPath).isDirectory()) {
      // filesAndFolders.push(itemPath);
      filesAndFolders.concat(
        fs.readdirSync(itemPath).map((item) => {
          const joinedPath = path.join(itemPath, item);
          console.log(joinedPath);
          return joinedPath;
        })
      );
    } else if (allowedExtensions.includes(fileExtension)) {
      const fileStream = fs.createReadStream(itemPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        combinedText += line + "\n";
      }
    }
    fs.appendFileSync(outputPath, combinedText);
  }
}
(async () => {
  const gitURL = "https://github.com/typescript-book-ja/typescript-book-jp.git";
  const targetFolder = "/git-repository";
  const outputPath = "./from_scrapbox/export.txt";  
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
  await cloneRepo(gitURL, targetFolder);
  await convertFilesToPlainText(targetFolder, outputPath, allowedExtensions);
})()
