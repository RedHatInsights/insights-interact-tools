import { log, execAsync, execSync } from './helpers.js';
import ora from 'ora';
import chalk from 'chalk';
export const clone = async (cwd, url, path) => {
  try {
    await execAsync(`git clone ${url} ${path}`, { cwd });

    return true;
  } catch {
    log.error('Cloning ' + url + ' failed.');
    return false;
  }
};

export const pullBranch = (cwd, remote, branch) => {
  const scriptSpinner = ora('Running "' + chalk.bold(`g pull ${remote} ${branch}`) + '" in ' + chalk.bold(cwd)).start();

  try {
    execSync(`git pull ${remote} ${branch}`, { cwd });
    scriptSpinner.succeed();
  } catch (error) {
    log.error('Pulling the branch failed due to: ' + error);
    scriptSpinner.fail();
  }
};

export const checkoutBranch = (cwd, remote, branch) => {
  try {
    execSync(`git checkout ${remote}/${branch}`, { cwd });
    log.plain(`Checked out at ${remote}/${branch}`);
    return true;
  } catch {
    log.error(`Switching to branch ${remote}/${branch}` + ' failed.');
    return false;
  }
};
