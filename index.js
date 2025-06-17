#!/usr/bin/env node

const ll = console.log;
const le = console.error;

const { spawn } = require("child_process");

const args = process.argv;

if (args.length === 2) {
  ll("Usage: pdg <command>");
  ll("i | install : npm install");
  ll("ui | uninstall : npm uninstall");
  ll("id | install-dev : npm install --save-dev");
  ll("ig | install-global : npm install --global");
  ll("ri | reinstall : npm run reinstall");
  ll("rim | reinstall-module : npm run reinstall:module");
  ll("rib | reinstall-bundle : npm run reinstall:bundle");
  ll("rip | reinstall-pod : npm run reinstall:pod");
  ll("c | commit : npm run git:commit");
  ll("p | push : npm run git:push");
  ll("cp | commit-push : npm run git:commit:push");
  ll(
    "cpp | commit-push-publish : npm run git:commit:push && npm run pub:(all|dev|staging|prod)",
  );
  ll("mm | merge-mirror : npm run git:merge:mirror");
  ll("b | build : npm run build");
  ll("pub | publish : npm run pub:(all|dev|staging|prod)");
  ll("lint : npm run lint");
  ll("test : npm run test");
  ll("gi | reset-gitignore : npm run reset:gitignore");
  ll("gc | git-commit : git commit");
  ll("gp | git-push : git push");
  ll("gcp | git-commit-push : git commit and push");
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
      ll(`> ${execCommands}`);

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
  } else if (["cpp", "commit-push-publish"].includes(command)) {
    await npmRunGitCommitPushPublish();
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
    le(`Unknown command: ${command}`);
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
    le("Usage: pdg id <package1> <package2> ...");
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
    le("Usage: pdg ui <package1> <package2> ...");
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
 * npmRunGitCommitPushPublish
 * ******************************************************************************************************************/
async function npmRunGitCommitPushPublish() {
  let commitMessage = "Update";
  let publishMode = "";

  if (args.length < 4) {
    le("Usage: pdg cpp <commit-message> (all|dev|staging|prod)");
    le("Usage: pdg cpp (all|dev|staging|prod)");
    process.exit(1);
  }

  if (args.length === 4) {
    publishMode = args[3];
  } else if (args.length > 4) {
    commitMessage = args[3];
    publishMode = args[4];
  }

  if (!["all", "dev", "staging", "prod"].includes(publishMode)) {
    le("Usage: pdg cpp <commit-message> (all|dev|staging|prod)");
    le("Usage: pdg cpp (all|dev|staging|prod)");
    process.exit(1);
  }

  await run([
    `npm run git:commit "${commitMessage}"`,
    "npm run git:push",
    `npm run pub:${publishMode}`,
  ]);
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
    le("Usage: pdg pub (all|dev|staging|prod)");
    process.exit(1);
  }

  const mode = args[3];
  if (!["all", "dev", "staging", "prod"].includes(mode)) {
    le(`Invalid mode: ${mode}\nUsage: pdg pub (all|dev|staging|prod)`);
    process.exit(1);
  }

  await run([`npm run pub:${mode}`]);
}
