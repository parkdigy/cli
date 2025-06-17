#!/usr/bin/env node

const { spawn } = require("child_process");

const args = process.argv;

if (args.length === 2) {
  console.log("Usage: pdg <command>");
  console.log("i | install : npm install");
  console.log("ui | uninstall : npm uninstall");
  console.log("id | install-dev : npm install --save-dev");
  console.log("ig | install-global : npm install --global");
  console.log("ri | reinstall : npm run reinstall");
  console.log("rim | reinstall-module : npm run reinstall:module");
  console.log("rib | reinstall-bundle : npm run reinstall:bundle");
  console.log("rip | reinstall-pod : npm run reinstall:pod");
  console.log("c | commit : npm run git:commit");
  console.log("p | push : npm run git:push");
  console.log("cp | commit-push : npm run git:commit:push");
  console.log("mm | merge-mirror : npm run git:merge:mirror");
  console.log("b | build : npm run build");
  console.log("pub | publish : npm run pub:(all|dev|staging|prod)");
  console.log("lint : npm run lint");
  console.log("test : npm run test");
  console.log("gi | reset-gitignore : npm run reset:gitignore");
  console.log("gc | git-commit : git commit");
  console.log("gp | git-push : git push");
  console.log("gcp | git-commit-push : git commit and push");
  process.exit(1);
}

function run(execCommands) {
  return new Promise(async (resolve) => {
    if (Array.isArray(execCommands)) {
      for (const execCommand of execCommands) {
        await run(execCommand);
      }
      resolve();
    } else {
      console.log(`> ${execCommands}`);

      const execCommandsArray = execCommands.split(" ");
      const command = execCommandsArray[0];
      const args = execCommandsArray.slice(1);
      const child = spawn(command, args, {
        stdio: "inherit",
        shell: true,
      });

      child.on("close", (code) => {
        if (code !== 0) {
          process.exit(1);
        } else {
          resolve();
        }
      });
    }
  });
}

(async () => {
  const command = args[2];

  if (["i", "install"].includes(command)) {
    await npmInstall();
  } else if (["ui", "uninstall"].includes(command)) {
    await npmUninstall();
  } else if (["id", "install-dev"].includes(command)) {
    await npmInstall("dev");
  } else if (["ig", "install-global"].includes(command)) {
    await npmInstall("global");
  } else if (["ri", "reinstall"].includes(command)) {
    await run("npm run reinstall");
  } else if (["rim", "reinstall-module"].includes(command)) {
    await run("npm run reinstall:module");
  } else if (["rib", "reinstall-bundle"].includes(command)) {
    await run("npm run reinstall:bundle");
  } else if (["rip", "reinstall-pod"].includes(command)) {
    await run("npm run reinstall:pod");
  } else if (["c", "commit"].includes(command)) {
    await npmRunGitCommit();
  } else if (["p", "push"].includes(command)) {
    await run("npm run git:push");
  } else if (["cp", "commit-push"].includes(command)) {
    await npmRunGitCommit();
    await run("npm run git:push");
  } else if (["mm", "merge-mirror"].includes(command)) {
    await run("npm run git:merge:mirror");
  } else if (["b", "build"].includes(command)) {
    await run("npm run build");
  } else if (["pub", "publish"].includes(command)) {
    await publish();
  } else if (command === "lint") {
    await run("npm run lint");
  } else if (command === "test") {
    await run("npm run test");
  } else if (["gi", "reset-gitignore"].includes(command)) {
    await run("npm run reset:gitignore");
  } else if (["gc", "git-commit"].includes(command)) {
    await gitCommit();
  } else if (["gp", "git-push"].includes(command)) {
    await run("git push");
  } else if (["gcp", "git-commit-push"].includes(command)) {
    await gitCommit();
    await run("git push");
  } else {
    console.error(`Unknown command: ${command}`);
  }
})();

/********************************************************************************************************************
 * npmInstall
 * ******************************************************************************************************************/
async function npmInstall(type) {
  const command =
    type === "global"
      ? "npm install --global"
      : type === "dev"
        ? "npm install --save-dev"
        : "npm install";

  const packages = args.splice(3);

  if (type === "dev" && packages.length === 0) {
    console.error("Usage: pdg id <package1> <package2> ...");
    process.exit(1);
  }

  await run(
    packages.length > 0 ? `${command} ${packages.join(" ")}` : `${command}`,
  );
}

/********************************************************************************************************************
 * npmUninstall
 * ******************************************************************************************************************/
async function npmUninstall() {
  const command = "npm uninstall";

  const packages = args.splice(3);

  if (packages.length === 0) {
    console.error("Usage: pdg ui <package1> <package2> ...");
    process.exit(1);
  }

  await run(
    packages.length > 0 ? `${command} ${packages.join(" ")}` : `${command}`,
  );
}

/********************************************************************************************************************
 * npmRunGitCommit
 * ******************************************************************************************************************/
async function npmRunGitCommit() {
  let commitMessage = "Update";

  if (args.length >= 4) {
    commitMessage = args[3];
  }

  await run([`npm run git:commit "${commitMessage}"`]);
}
/********************************************************************************************************************
 * gitCommit
 * ******************************************************************************************************************/
async function gitCommit() {
  let commitMessage = "Update";

  if (args.length >= 4) {
    commitMessage = args[3];
  }

  await run(["git add .", `git commit -m "${commitMessage}"`]);
}

/********************************************************************************************************************
 * publish
 * ******************************************************************************************************************/
async function publish() {
  if (args.length < 4) {
    console.error("Usage: pdg pub (all|dev|staging|prod)");
    process.exit(1);
  }

  const mode = args[3];
  if (!["all", "dev", "staging", "prod"].includes(mode)) {
    console.error(
      `Invalid mode: ${mode}\nUsage: pdg pub (all|dev|staging|prod)`,
    );
    process.exit(1);
  }

  await run([`npm run pub:${mode}`]);
}
