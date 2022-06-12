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

export const drawTable = (columns, rows) => {
  const table = new Table({
    style: { head: [], border: [] },
    head: columns
  });

  for (const row of rows) {
    table.push(row);
  }

  log.plain(table.toString());
};
