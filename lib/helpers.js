import { exec, execSync as nodeExecSync } from 'node:child_process';
import util from 'node:util';
import Table from 'cli-table';
import logSymbols from 'log-symbols';
import chalk from 'chalk';
import fs from 'node:fs';
import YAML from 'yaml';
import ora from 'ora';
import { resetToBranch, checkoutNewBranch, fetchRemote } from './gitHelpers.js';
// TODO it should be configurable which protocol to use in the config file
// TODO Maybe it should also be possible to use any other repo url/host
// TODO this should be an app helper
export const githubRepoUrl = (owner, repo, https = false) =>
  https ? `https://github.com/${owner}/${repo}.git` : `git@github.com:${owner}/${repo}.git`;

export const execAsync = util.promisify(exec);
export const execSync = (command, path) => exec(command, path);
export const nodeSyncExec = (command, path) => nodeExecSync(command, path);

export const log = {
  info: (...msg) => console.log(logSymbols.info, ...msg),
  success: (...msg) => console.log(logSymbols.success, ...msg),
  error: (...msg) => console.log(logSymbols.error, ...msg),
  warn: (...msg) => console.log(logSymbols.warning, ...msg),
  plain: (...msg) => console.log(...msg),
  chalk: (color, ...msg) => console.log(chalk[color](...msg))
};

export const readGHuser = () => {
  try {
    const ghHostsFilePath = process.env.HOME + '/.config/gh/hosts.yml';
    const fileContents = fs.readFileSync(ghHostsFilePath, 'utf8');
    return YAML.parse(fileContents)['github.com'].user;
  } catch (e) {
    log.error(e.message);
  }
};

const tableStyles = {
  plain:
    {
      chars: {
        top: '',
        'top-mid': '',
        'top-left': '',
        'top-right': '',
        bottom: '',
        'bottom-mid': '',
        'bottom-left': '',
        'bottom-right': '',
        left: '',
        'left-mid': '',
        mid: '',
        'mid-mid': '',
        right: '',
        'right-mid': '',
        middle: ' '
      },
      style: { 'padding-left': 0, 'padding-right': 4 }
    },
  fancy: {
    chars: {
      top: '═',
      'top-mid': '╤',
      'top-left': '╔',
      'top-right': '╗',
      bottom: '═',
      'bottom-mid': '╧',
      'bottom-left': '╚',
      'bottom-right': '╝',
      left: '║',
      'left-mid': '╟',
      mid: '─',
      'mid-mid': '┼',
      right: '║',
      'right-mid': '╢',
      middle: '│'
    },
    style: { head: [], border: [] }
  }
};

export const buildTable = (columns, rows, style) => {
  const table = new Table({
    ...(tableStyles[style] || {}),
    head: columns
  });

  for (const row of rows) {
    table.push(row);
  }

  return table.toString();
};

export const drawTable = (columns, rows, border) => {
  const table = border
    ? new Table({
      chars: {
        top: '═',
        'top-mid': '╤',
        'top-left': '╔',
        'top-right': '╗',
        bottom: '═',
        'bottom-mid': '╧',
        'bottom-left': '╚',
        'bottom-right': '╝',
        left: '║',
        'left-mid': '╟',
        mid: '─',
        'mid-mid': '┼',
        right: '║',
        'right-mid': '╢',
        middle: '│'
      },
      style: { head: [], border: [] },
      head: columns
    })
    : new Table({
      style: { head: [], border: [] },
      head: columns
    });

  for (const row of rows) {
    table.push(row);
  }

  log.plain(table.toString());
};

export async function login (browser, origin, user, password) {
  // go to insights, and type in the username
  const page = await browser.newPage();
  await page.goto(origin);
  await page.waitForSelector('input[name=username]');
  /*                                                  Input username */
  await page.type('input[name=username]', user);
  await page.keyboard.press('Enter');
  // Once greeted with password portion, enter password and press Enter
  await page.waitForSelector('input[type=password]');
  /*                                                  Input password */
  await page.type('input[type=password]', password);
  await page.$eval('button[type=submit]', (el) => el.click());
  await page.close();
  // The page has been closed, but the browser still has the relevant session.
}

export const readJsonFile = (filePath) => {
  const jsonData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(jsonData);
};

export const readYmlFile = (filePath) => {
  const ymlData = fs.readFileSync(filePath, 'utf8');
  return YAML.parse(ymlData);
};

export const tryCommandRun = (command, cwd, successMessage, errorMessage) => {
  const scriptSpinner = ora('Running "' + chalk.bold(command) + '" in ' + chalk.bold(cwd)).start();

  try {
    const result = nodeSyncExec(command, { cwd });
    successMessage && log.plain(successMessage);
    scriptSpinner.succeed();

    // Some commands return result, while others silently succeed
    return result || true;
  } catch (error) {
    errorMessage && log.error(`${errorMessage} due to: ${error}`);
    scriptSpinner.fail();
  }
};

export const prepareGitRepo = (repoPath, alignBranchName) => {
  if (!checkoutNewBranch(repoPath, alignBranchName)) {
    throw new Error('Git branch is not ready to create a PR, checking out to a new branch has failed');
  };
  if (!fetchRemote(repoPath, 'upstream')) {
    throw new Error('Git branch is not ready to create a PR, fetching remote has failed');
  };
  if (!resetToBranch(repoPath, 'upstream')) {
    throw new Error('Git branch is not ready to create a PR, resetting to remote has failed');
  };

  return true;
};
