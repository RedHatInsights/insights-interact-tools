import Table from 'cli-table';
import chalk from 'chalk';
import semver from 'semver';
import figures from 'figures';
import { execAsync, log } from '../../lib/helpers.js';

const coloredPackageRow = (row, { current, latest }) => ({
  major: (row) => row.map((word) => chalk.red(word)),
  minor: (row) => row.map((word) => chalk.yellow(word)),
  patch: (row) => row.map((word) => chalk.green(word))
}[semver.diff(current, latest)] || ((row) => (row)))(row);

const packageFilter = (packagePattern) => ([name]) => {
  // TODO support NOT matching via "!" prefixed patterns
  // TODO support multiple comma separated patterns
  // TODO support exact matching
  // TODO just support some sort of query language to drill down packages
  /**
   *    "@redhat" should match all packages starting with this term ("@" has no significants)
   *    "!@redhat" should match all packages not starting with this term
   *    "~@redhat" should match all packages containing the term (this can also be negated with "!" at the start
   *    "$@redhat" should match all packages ending with the term
   *    "=@patternfly/react-core" should match the package exactly matching
   *    "@redhat=major" should match all package updates that are starting with the term and are major updates (other levels should work too)
   */
  return name.startsWith(packagePattern);
};

const buildPackageTable = (appName, pkgJson, packagePattern) => {
  const packages = ((json, pattern) => {
    const pkgs = Object.entries(JSON.parse(json));
    return pattern ? pkgs.filter(packageFilter(pattern)) : pkgs;
  })(pkgJson, packagePattern);
  const packageCount = packages.length;

  if (packageCount > 0) {
    const table = new Table({
      style: { head: [], border: [] },
      head: ['Package name', 'Current version', 'Latest version']
    });

    packages.forEach(([name, { current, latest }]) => {
      table.push(coloredPackageRow([name, current, latest], { current, latest }));
    });

    log.plain('\n');
    log.warn(packageCount + ' outdated packages in ' + appName + (packagePattern ? ` matching "${packagePattern}"` : ''));
    log.plain(table.toString());
  }
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
