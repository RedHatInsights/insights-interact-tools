import ora from 'ora';
import chalk from 'chalk';
import { log, execAsync } from '../../lib/helpers.js';

export const flags = {
  command: {
    type: 'string',
    alias: ['c'],
    description: 'Shell command to run'
  }
};

export const help = `
  Run a command provided via -c on installed/selected apps.
`;

export default async ({ flags: { command } }, { apps = [] }) => {
  for (const app of apps) {
    const scriptSpinner = ora('Running "' + chalk.bold(command) + '" in ' + chalk.bold(app.name)).start();
    try {
      const { stdout } = await execAsync(command, { cwd: app.repoPath });
      scriptSpinner.succeed();
      log.plain(stdout);
    } catch ({ stdout, stderr }) {
      scriptSpinner.fail();
      log.plain(stdout);
      log.plain(stderr);
    }
  }
};
