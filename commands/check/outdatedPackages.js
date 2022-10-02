import chalk from 'chalk';
import semver from 'semver';
import figures from 'figures';
import { log, drawTable } from '../../lib/helpers.js';
import { filteredPackages } from '../../lib/packageHelpers.js';
import { listOutdated } from '../../lib/npmHelpers.js';

export const flags = {
  packagepattern: {
    type: 'string',
    alias: ['pp', 'p'],
    description: 'Allows defining a simple pattern to limit packages queried/listed.'
  }
};

export const help = `
  Queries all apps for outdated packages and lists them.
`;

const coloredPackageRow = (row, { current, latest }) => ({
  major: (row) => row.map((word) => chalk.red(word)),
  minor: (row) => row.map((word) => chalk.yellow(word)),
  patch: (row) => row.map((word) => chalk.green(word))
}[semver.diff(current, latest)] || ((row) => (row)))(row);

const listOutdatedPackages = async ({ name, repoPath }, { flags: { packagepattern } }) => {
  const packages = filteredPackages((await listOutdated(repoPath)), packagepattern);

  if (packages.length > 0) {
    const colouredPackages = packages.map(({ name, current, latest }) =>
      coloredPackageRow([name, current, latest], { current, latest })
    );

    log.warn(packages.length + ' outdated packages in ' + name + (packagepattern ? ` matching "${packagepattern}"` : ''));
    drawTable(
      ['Package name', 'Current version', 'Latest version'],
      colouredPackages
    );
    log.plain('\n');
  }
};

const introLog = () => {
  log.info('Checking for outdated packages');

  log.plain(
    chalk.red(figures.circleFilled), 'Major update', '\t\t\t',
    chalk.yellow(figures.circleFilled), 'Minor update', '\t\t\t',
    chalk.green(figures.circleFilled), 'Patch update'
  );

  log.plain('\n');
};

export default async (cli, { apps }) => {
  introLog();
  for (const app of apps) {
    await listOutdatedPackages(app, cli);
  }
};
