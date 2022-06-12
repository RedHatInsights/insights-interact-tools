import { execAsync, log } from './helpers.js';

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

export const list = async (cwd) => {
  try {
    const { stdout: json } = await execAsync('npm ls --json', {
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

export const update = async (cwd, packages) => {
  // TODO allow setting the level of update major, minor, patch or specific version
  const packageList = packages.map((name) => name + '@latest');
  try {
    await execAsync('npm install ' + packageList, { cwd });
    return true;
  } catch {
    return false;
  }
};
