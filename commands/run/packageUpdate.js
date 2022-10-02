import { log } from '../../lib/helpers.js';
import { filteredPackages } from '../../lib/packageHelpers.js';
import { listOutdated, update } from '../../lib/npmHelpers.js';

export const flags = {
  packagepattern: {
    type: 'string',
    alias: ['pp', 'p'],
    description: 'Allows defining a simple pattern to limit packages updated.'
  }
};

export const help = `
  Update packages in installed applications.
`;

const updatePackagesInApp = async (app, packages) => {
  for (const pkg of packages) {
    log.info('Updating ' + pkg + ' in ' + app.name);
    await update(app.repoPath, [pkg]);
  }
};

const updatePackages = async (app, cli, config) => {
  const pkgJson = await listOutdated(app.repoPath);
  const packagePattern = cli.flags.packagepattern;
  const packages = filteredPackages(pkgJson, packagePattern);
  const packageCount = packages.length;
  const packageList = packages.map(([name]) => (name));

  if (packageCount > 0) {
    await updatePackagesInApp(app, packageList);

    if (app.onPackageUpdateComplete) {
      log.info('Running package update hook for ' + app.name);
      await app.onPackageUpdateComplete?.(cli, config, app);
    }
  }
};

export default async (cli, config) => {
  for (const app of (config.apps || [])) {
    await updatePackages(app, cli, config);
  }
};
