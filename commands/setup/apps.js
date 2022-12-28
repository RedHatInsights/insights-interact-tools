import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import ora from 'ora';
import { githubRepoUrl, log } from '../../lib/helpers.js';
import { togglePrompt } from '../../lib/promptHelpers.js';
import { cleanInstall } from '../../lib/npmHelpers.js';
import { clone } from '../../lib/gitHelpers.js';

export const flags = {
  reset: {
    type: 'boolean',
    alias: 'r',
    description: 'Removes the base directory and creates fresh clones of all apps'
  }
};

export const help = `
  Creates a directory, clones applications in it and sets them up.
`;

const resetBaseDirectory = async ({ flags: { reset } }, { basePath }) => {
  if (reset) {
    const force = await togglePrompt('Really reset/remove ' + basePath + '?');
    const resetSpinner = ora(`Removing base directory ${basePath}!`).start();

    if (force) {
      await rm(basePath, { recursive: true, force });
      resetSpinner.succeed('Base directory removed.');
    };
  };
};

const createBaseDirectory = async (_, { basePath }) => {
  if (!existsSync(basePath)) {
    await mkdir(basePath);
    log.success(`Base directory ${basePath} created!`);
  } else {
    log.info('Base directory already exists.');
  };
};

const cloneApps = async (_, { apps }) => {
  log.info(`Cloning apps: ${apps.map(({ name }) => (name)).join(', ')}`);
  const cloneSpinner = ora('Cloning...').start();
  const skipped = [];

  for (const { name, owner, repo, basePath, repoPath } of apps) {
    if (existsSync(repoPath)) {
      skipped.push(name);
    } else {
      cloneSpinner.text = `Cloning ${name}`;
      const cloned = await clone(basePath, githubRepoUrl(owner, repo), repoPath);

      if (!cloned) {
        skipped.push(name);
      }
      // TODO after the repository is cloned the "origin" remote should be remove (or renamed to "upstream").
      // TODO Setup origin remotes using githubUser
    }
  };

  cloneSpinner.succeed('All applications cloned.');

  if (skipped.length > 0) {
    log.info(`Working copies for ${skipped.join(', ')} already existed. `);
  };
};

const npmInstalls = async (_, { apps }) => {
  log.info('Installing npm packages for cloned apps. Might take a while...');
  const npmSpinner = ora('Installing npm packages...').start();

  for (const { name, repoPath } of apps) {
    npmSpinner.text = `Installing packages for ${name}`;
    await cleanInstall(repoPath);
  };

  npmSpinner.succeed('All npm packages installed.');
};

export default async (cli, config) => {
  for (const command of [
    resetBaseDirectory,
    createBaseDirectory,
    cloneApps,
    npmInstalls
  ]) {
    await command(cli, config);
  }
};
