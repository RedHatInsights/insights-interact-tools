import Table from 'cli-table';
import chalk from 'chalk';
import semver from 'semver';
import figures from 'figures';
import { log } from '../../lib/helpers.js';
import { filteredPackages } from '../../lib/packageHelpers.js';
import { listOutdated } from '../../lib/npmHelpers.js';

const coloredPackageRow = (row, { current, latest }) => ({
  major: (row) => row.map((word) => chalk.red(word)),
  minor: (row) => row.map((word) => chalk.yellow(word)),
  patch: (row) => row.map((word) => chalk.green(word))
}[semver.diff(current, latest)] || ((row) => (row)))(row);

const buildPackageTable = (appName, pkgJson, packagePattern) => {
  const packages = filteredPackages(pkgJson, packagePattern);
  const packageCount = packages.length;

  if (packageCount > 0) {
    const table = new Table({
      style: { head: [], border: [] },
      head: ['Package name', 'Current version', 'Latest version']
    });

    for (const [name, { current, latest }] of packages) {
      table.push(coloredPackageRow([name, current, latest], { current, latest }));
    }

    log.plain('\n');
    log.warn(packageCount + ' outdated packages in ' + appName + (packagePattern ? ` matching "${packagePattern}"` : ''));
    log.plain(table.toString());
  }
};

const checkOutdated = async ({ name, repoPath }, { flags: { packagepattern } }) => {
  try {
    const packages = await listOutdated(repoPath);
    buildPackageTable(name, packages, packagepattern);
  } catch (error) {
    log.error('Failed to check outated packages in ' + name);
    throw error;
  }
};

const introLog = () => {
  log.info('Checking for outdated packages');

  log.plain(
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
