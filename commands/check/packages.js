import Table from 'cli-table';
import chalk from 'chalk';
import semver from 'semver';
import figures from 'figures';

import { readConfig, execAsync, log } from '../helpers.js';

const coloredPackageRow = (row, { current, latest }) => ({
  major: (row) => row.map((word) => chalk.red(word)),
  minor: (row) => row.map((word) => chalk.yellow(word)),
  patch: (row) => row.map((word) => chalk.green(word))
}[semver.diff(current, latest)] || ((row) => (row)))(row);

const buildPackageTable = (appName, pkgJson, packagePattern) => {
  const packages = JSON.parse(pkgJson);
  const table = new Table({
    head: ['Package name', 'Current version', 'Latest version']
  });

  Object.entries(packages).forEach(([name, { current, latest }]) => {
    const args = [[name, current, latest], { current, latest }];

    if (packagePattern) {
      if (name.startsWith(packagePattern)) {
        table.push(coloredPackageRow(...args));
      }
    } else {
      table.push(coloredPackageRow(...args));
    };
  });

  console.log('\n');
  log.warn(Object.keys(packages).length + ' Outdated packages in ' + appName);
  console.log(table.toString());
};

const checkOutdated = async ({ name, repoPath }, { flags: { packagepattern } }) => {
  try {
    const { stdout: json } = await execAsync('npm outdated --json 2> /dev/null; exit 0', {
      cwd: repoPath
    });

    buildPackageTable(name, json, packagepattern);
  } catch (error) {
    log.error('Failed to check outated packages in ' + name);
    throw error;
  }
};

const introLog = () => {
  log.info('Checking for outdated packages');

  console.log(
    chalk.red(figures.circleFilled), 'Major update', '\t\t',
    chalk.yellow(figures.circleFilled), 'Minor update', '\t\t',
    chalk.green(figures.circleFilled), 'Patch update'
  );
};

export default async (cli, { apps }) => {
  introLog();
  return Promise.all(apps.map(async (app) =>
    await checkOutdated(app, cli)
  ));
};
