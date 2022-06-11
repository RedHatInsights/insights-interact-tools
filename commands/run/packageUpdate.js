import { log } from '../../lib/helpers.js';
import { filteredPackages } from '../../lib/packageHelpers.js';
import { listOutdated, update } from '../../lib/npmHelpers.js';

const updatePackagesInApp = async (app, packages) => {
  // TODO implement strategies to install packages all at once or one by one
  await update(app.repoPath, packages);
};

const updatePackages = async (app, cli) => {
  const pkgJson = await listOutdated(app.repoPath);
  const packagePattern = cli.flags.pp;
  const packages = filteredPackages(pkgJson, packagePattern);
  const packageCount = packages.length;
  const packageList = packages.map(([name]) => (name));

  if (packageCount > 0) {
    log.info('Updating ' + packageList.join(',') + 'in ' + app.name); ;
    await updatePackagesInApp(app, packageList);
  }
};

export default async (cli, { apps }) =>
  Promise.all(apps.map(async (app) =>
    await updatePackages(app, cli)
  ));
