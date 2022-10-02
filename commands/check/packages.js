import { log, drawTable } from '../../lib/helpers.js';
import { filteredPackages } from '../../lib/packageHelpers.js';
import { list } from '../../lib/npmHelpers.js';

export const flags = {
  packagepattern: {
    type: 'string',
    alias: ['pp', 'p'],
    description: 'Allows defining a simple pattern to limit packages listed.'
  }
};

export const help = `
  Queries all apps for packages and lists them.
`;

const listPackages = async (app, cli) => {
  const packagePattern = cli.flags.pp;
  const packages = filteredPackages((await list(app.repoPath)), packagePattern);
  const packageCount = packages.length;

  if (packageCount > 0) {
    log.info(packageCount + ' packages in ' + app.name + (packagePattern ? ` matching "${packagePattern}"` : ''));
    drawTable(
      ['Package name', 'Current version'],
      packages.map(({ name, version }) => [name, version])
    );
  }
};

export default async (cli, { apps }) => {
  for (const app of apps) {
    await listPackages(app, cli);
  }
};
