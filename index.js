#!/usr/bin/env node

const { spawn } = require("child_process");

const args = process.argv;

if (args.length === 2) {
  console.log("Usage: pdg <command>");
  console.log("i | install : npm install");
  console.log("ui | uninstall : npm uninstall");
  console.log("id | install-dev : npm install --save-dev");
  console.log("ig | install-global : npm install --global");
  console.log("ri | reinstall : reinstall modules");
  console.log("c | commit : git commit");
  console.log("p | push : git push");
  console.log("cp | commit-push : git commit and push");
  console.log("b | build : npm run build");
  console.log("pub | publish : npm run pub:(all|dev|staging|prod)");
  console.log("lint : npm run lint");
  console.log("test : npm run test");
  console.log("gi | reset-gitignore : reset git ignore");
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
    await run([
      "rm -rf node_modules",
      "rm -f package-lock.json",
      "npm install",
    ]);
  } else if (["c", "commit"].includes(command)) {
    await gitCommit();
  } else if (["p", "push"].includes(command)) {
    await run("git push");
  } else if (["cp", "commit-push"].includes(command)) {
    await gitCommit();
    await run("git push");
  } else if (["b", "build"].includes(command)) {
    await run("npm run build");
  } else if (["pub", "publish"].includes(command)) {
    await publish();
  } else if (command === "lint") {
    await run("npm run lint");
  } else if (command === "test") {
    await run("npm run test");
  } else if (["gi", "reset-gitignore"].includes(command)) {
    await run(["git rm -r --cached .", "git add ."]);
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
