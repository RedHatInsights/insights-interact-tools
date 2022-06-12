import { log, execAsync } from '../../lib/helpers.js';

export const clone = async (cwd, url, path) => {
  try {
    await execAsync(`git clone ${url} ${path}`, { cwd });

    return true;
  } catch {
    log.error('Cloning ' + url + ' failed.');
    return false;
  }
};
