import path from 'node:path';
import repositories from '../repositories.js';

const baseConfig = {
  repositories
};

export const fullConfig = (userAppConfig) => ({
  ...baseConfig.repositories[userAppConfig.name],
  repoPath: path.join(userAppConfig.basePath, userAppConfig.name),
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
  // TODO by default a ~/.insights-interact.js file should be used if it exists
  compileConfig((await import(configPath)).default);
