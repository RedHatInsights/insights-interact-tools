import { log, execAsync, execSync, nodeSyncExec, tryCommandRun } from './helpers.js';
import ora from 'ora';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import path from 'node:path';
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

export const createPullRequest = (cwd, title, description) => {
  const dirname = path.dirname(fileURLToPath(import.meta.url));

  try {
    nodeSyncExec(`sh ${dirname}/../scripts/createPullRequest.sh ${cwd} "${title}" "${description}"`);
  } catch {
    log.error('PR create failed, however you can create the PR yourself based on current changes made');
  }
};

export const getMainBranch = (cwd) => {
  return tryCommandRun(
    'git remote show upstream | grep "HEAD branch" | sed \'s/.*: //\'',
    cwd
  );
};

export const stashChanges = (cwd) => {
  return tryCommandRun(
    'git stash',
    cwd
  );
};

export const resetToBranch = (cwd, remote) => {
  const remoteMainBranch = getMainBranch(cwd);

  return tryCommandRun(
    `git reset ${remote}/${remoteMainBranch}`,
    cwd,
    `Reset to ${remoteMainBranch} has been done`,
    'Resetting new working branch failed'
  ) && stashChanges(cwd);
};

export const checkoutNewBranch = (cwd, branch) => {
  return tryCommandRun(
    `git checkout -b ${branch}`,
    cwd,
    `Checked out at ${branch}`,
    `Switching to branch ${branch} failed`
  );
};

export const fetchRemote = (cwd, remote) => {
  return tryCommandRun(
    `git fetch ${remote}`,
    cwd,
    'upstream has benn fetched',
    `Fetching ${remote} failed.`
  );
};
