import { execAsync } from './helpers.js';

export const list = async (path) => {
  const { stdout: json } = await execAsync('npm ls --json', {
    cwd: path
  });

  return JSON.parse(json).dependencies;
};

export const listOutdated = async (path) => {
  const { stdout: json } = await execAsync('npm outdated --json 2> /dev/null; exit 0', {
    cwd: path
  });

  return JSON.parse(json);
};

export const update = async (path, packages) => {
  // TODO allow setting the level of update major, minor, patch or specific version
  const packageList = packages.map((name) => name + '@latest');
  await execAsync('npm install ' + packageList, {
    cwd: path
  });
};
