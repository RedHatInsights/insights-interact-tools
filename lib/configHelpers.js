import path from 'node:path';
import { writeFileSync, readFileSync } from 'node:fs';
import YAML from 'yaml';
import repositories from '../repositories.js';

export const configHomePath = process.env.HOME + '/.insights-interact.yml';

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
  apps: config?.apps?.map(compileAppConfig(config)) || []
});

export const saveConfigFile = async (configPath, config = {}) => {
  try {
    writeFileSync(configPath, YAML.stringify(config));
  } catch (err) {
    return {};
  }
};

export const readConfigFile = async (configPath) => {
  try {
    const fileContents = readFileSync(configPath, 'utf8');
    return YAML.parse(fileContents);
  } catch (error) {
    return {};
  }
};

export const readConfig = async ({ configPath = configHomePath }) =>
  compileConfig(await readConfigFile(configPath));
