#!/usr/bin/env node

const message = process.argv.slice(2).join(' ') || 'Update';

const { spawn } = require('child_process');

function run(execCommands) {
  return new Promise(async (resolve) => {
    if (Array.isArray(execCommands)) {
      for (const execCommand of execCommands) {
        await run(execCommand);
      }
      resolve();
    } else {
      console.log(`> ${execCommands}`);

      const execCommandsArray = execCommands.split(' ');
      const command = execCommandsArray[0];
      const args = execCommandsArray.slice(1);
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
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
  await run(`git add .`);
  await run(`git commit -m "${message}"`);
})();
