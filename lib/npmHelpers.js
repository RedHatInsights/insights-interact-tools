import { execAsync, log } from './helpers.js';
import ora from 'ora';
import chalk from 'chalk';

export const cleanInstall = async (cwd) => {
  try {
    await execAsync('npm ci', { cwd });
    return true;
  } catch {
    return false;
  }
};

export const install = async (cwd) => {
  try {
    await execAsync('npm install', { cwd });
    return true;
  } catch {
    return false;
  }
};

export const list = async (cwd, params) => {
  try {
    const { stdout: json } = await execAsync(`npm ls --json ${params}`, {
      cwd
    });

    return Object.entries(JSON.parse(json).dependencies).map(([name, pkg]) => ({ ...pkg, name }));
  } catch {
    return [];
  }
};

export const listOutdated = async (path) => {
  try {
    const { stdout: json } = await execAsync('npm outdated --json 2> /dev/null; exit 0', {
      cwd: path
    });

    return Object.entries(JSON.parse(json)).map(([name, pkg]) => ({ ...pkg, name }));
  } catch {
    log.error('Failed to check outated packages in ' + path);
    return [];
  }
};

export const update = async (cwd, packages, config = { isSpeficVersion: false }) => {
  const packageList = config.isSpeficVersion ? packages : packages.map((name) => name + '@latest');
  const scriptSpinner = ora('Running "' + chalk.bold('npm install ' + packageList.join(' ')) + '" in ' + chalk.bold(cwd)).start();
  try {
    await execAsync('npm install ' + packageList.join(' '), { cwd });
    scriptSpinner.succeed();
    return true;
  } catch (error) {
    log.error('Updating package(s) failed due to: ' + error);
    scriptSpinner.fail();
    return false;
  }
};
