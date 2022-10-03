import { exec } from 'node:child_process';
import util from 'node:util';
import Table from 'cli-table';
import logSymbols from 'log-symbols';
import chalk from 'chalk';
import fs from 'node:fs';
import YAML from 'yaml';

// TODO it should be configurable which protocol to use in the config file
// TODO Maybe it should also be possible to use any other repo url/host
// TODO this should be an app helper
export const githubRepoUrl = (owner, repo, https = false) =>
  https ? `https://github.com/${owner}/${repo}.git` : `git@github.com:${owner}/${repo}.git`;

export const execAsync = util.promisify(exec);

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
