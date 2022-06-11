import Table from 'cli-table';
import { log } from '../../lib/helpers.js';
import { filteredPackages } from '../../lib/packageHelpers.js';
import { list } from '../../lib/npmHelpers.js';

const listPackages = async (app, cli) => {
  const pkgJson = await list(app.repoPath);
  const packagePattern = cli.flags.pp;
  const packages = filteredPackages(pkgJson, packagePattern);
  const packageCount = packages.length;

  const table = new Table({
    style: { head: [], border: [] },
    head: ['Package name', 'Current version']
  });

  packages.forEach(([name, { version }]) => {
    table.push([name, version]);
  });

  log.plain('\n');
  log.info(packageCount + ' packages in ' + app.name + (packagePattern ? ` matching "${packagePattern}"` : ''));
  log.plain(table.toString());
};

export default async (cli, { apps }) =>
  Promise.all(apps.map(async (app) =>
    await listPackages(app, cli)
  ));
