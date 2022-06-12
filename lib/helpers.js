import { exec } from 'node:child_process';
import util from 'node:util';
import logSymbols from 'log-symbols';
import chalk from 'chalk';

// TODO it should be configurable which protocol to use in the config file
// TODO Maybe it should also be possible to use any other repo url/host
// TODO this should be an app helper
export const githubRepoUrl = (owner, repo, https = false) =>
  https ? `https://github.com/${owner}/${repo}.git` : `git@github.com:${owner}/${repo}.git`;

// TODO replace exec's with shelljs functions
export const execAsync = util.promisify(exec);

export const log = {
  info: (...msg) => console.log(logSymbols.info, ...msg),
  success: (...msg) => console.log(logSymbols.success, ...msg),
  error: (...msg) => console.log(logSymbols.error, ...msg),
  warn: (...msg) => console.log(logSymbols.warning, ...msg),
  plain: (...msg) => console.log(...msg),
  chalk: (color, ...msg) => console.log(chalk[color](...msg))
};
