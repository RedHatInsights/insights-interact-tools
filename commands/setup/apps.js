import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { githubRepoUrl, execAsync, log } from '../../lib/helpers.js';

const createBaseDirectory = async ({ flags: { reset } }, { basePath }) => {
  if (reset) {
    log.warn('Resetting base directory!');
    await rm(basePath, { recursive: true, force: true });
  };
  const baseExists = existsSync(basePath);
  if (!baseExists) {
    await mkdir(basePath);
    log.success(`Base directory ${basePath} created!`);
  } else {
    log.info('Base directory already existed');
  };
};

const cloneApps = (_, { basePath, apps }) => {
  log.info(`Cloning apps: ${apps.map(({ name }) => (name)).join(',')}`);

  return Promise.all(apps.map(async ({ name, owner, repo, basePath, repoPath }) => {
    const repoExists = existsSync(repoPath);

    if (repoExists) {
      log.info(`Working copy for ${name} already existed.`);
    } else {
      // TODO use nodegit for this and any other git operations https://www.nodegit.org
      await execAsync(`git clone ${githubRepoUrl(owner, repo)} ${repoPath}`, {
        cwd: basePath
      });

      log.success(`Cloned ${name}`);
    }
  }
  ));
};

const npmInstalls = async (_, { basePath, apps }) => {
  log.info('Installing npm packages for cloned apps. Might take a while...');

  return Promise.all(apps.map(async ({ name, repoPath }) => {
    await execAsync('npm ci', {
      cwd: repoPath
    });

    log.success(`Installed packages for ${name}`);
  }));
};

export default async (cli, config) => {
  await createBaseDirectory(cli, config);
  await cloneApps(cli, config);
  await npmInstalls(cli, config);
  // TODO Setup origin/upstream remotes using githubUser
};
