import { exec } from 'node:child_process';
import util from 'node:util';
import { join } from 'node:path';
import logSymbols from 'log-symbols';
import baseConfig from './base.config.js';

export const fullConfig = (userAppConfig) => ({
  ...baseConfig.repositories[userAppConfig.name],
  repoPath: join(userAppConfig.basePath, userAppConfig.name),
  ...userAppConfig
});

export const compileAppConfig = ({ basePath }) => (app) => {
  if (typeof app === 'string') {
    return fullConfig({ name: app, basePath });
  } else {
    return fullConfig({ ...app, basePath });
  }
};

const compileConfig = (config) => ({
  ...config,
  apps: config.apps.map(compileAppConfig(config))
});

export const readConfig = async ({ configPath }) =>
  compileConfig((await import(configPath)).default);

// TODO it should be configurable which protocol to use in the config file
// TODO Maybe it should also be possible to use any other repo url/host
export const githubRepoUrl = (owner, repo, https = false) =>
  https ? `https://github.com/${owner}/${repo}.git` : `git@github.com:${owner}/${repo}.git`;

export const execAsync = util.promisify(exec);

export const log = {
  info: (msg) => console.log(logSymbols.info, msg),
  success: (msg) => console.log(logSymbols.success, msg),
  error: (msg) => console.log(logSymbols.error, msg),
  warn: (msg) => console.log(logSymbols.warning, msg)
};
