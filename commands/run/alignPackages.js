/* eslint-disable no-unused-vars */
import { log, readJsonFile, execAsync } from '../../lib/helpers.js';
import { framework as frameworkRepos } from '../../repositories.js';
import { update } from '../../lib/npmHelpers.js';
import { checkoutBranch, pullBranch } from '../../lib/gitHelpers.js';

export const flags = {
  app: {
    type: 'string',
    alias: ['a'],
    isRequired: true,
    description: 'The application that you are going to align with the chrome app.'
  },
  packages: {
    type: 'string',
    alias: ['p'],
    isRequired: true,
    description: 'The package that you are going to align the versions. If you would like to align multiple packages, you can use comma separated names'
  }
};

export const help = `
  This command helps you to align the versions of your packages to the chrome one.
`;

const introLog = () => {
  log.plain('This will help you to align all versions of pro...');
};

const readPkgJson = (appFolder) => readJsonFile(`${appFolder}/package.json`);

const getAppData = (apps, app) => {
  const appFolder = apps.find(({ name }) => name === app)?.repoPath;

  return [
    readPkgJson(appFolder),
    appFolder,
    app
  ];
};

const findFecApps = (apps, currentApp, appJson, pkgName) => {
  const allProdDeps = Object.keys(appJson.dependencies);

  const fecDeps = allProdDeps.filter(dep =>
    dep.startsWith('@redhat-cloud-services/frontend-components')
  );

  const fecApps = [];
  apps.forEach(app => {
    const { dependencies, name } = readPkgJson(app.repoPath) || {};

    if (fecDeps.includes(name) && app.name !== currentApp.name) {
      fecApps.push({
        ...app,
        pkgVersion: dependencies[pkgName]
      });
    }
  });

  return fecApps;
};

const updatePackages = (updateConfigs) => {
  const configs = Object.keys(updateConfigs);
  configs.forEach((config) => {
    const { repoPath, packages } = updateConfigs[config];
    console.log(repoPath);
    console.log(packages);

    update(repoPath, packages, { isSpeficVersion: true });
  });
};

const buildUpdateConfig = (apps, app, packages) => {
  const packagesArray = packages.split(',');

  const updateConfig = {};
  packagesArray.forEach(pkgName => {
    const [packageJson, folder] = getAppData(apps, app, pkgName);
    const [chromePkgJson] = getAppData(apps, frameworkRepos['insights-chrome'].repo);
    const chromeVersion = chromePkgJson.dependencies[pkgName];
    const packageToUpdate = `${pkgName}@${chromeVersion}`;

    if (packageJson[pkgName] !== chromeVersion) {
      updateConfig[app] = {
        ...(updateConfig[app] || {}),
        packages: [
          ...updateConfig[app]?.packages || [],
          packageToUpdate
        ],
        repoPath: folder
      };
    };

    const fecDeps = findFecApps(apps, app, packageJson, pkgName);

    fecDeps.forEach(fecApp => {
      if (fecApp.pkgVersion !== chromeVersion) {
        updateConfig[fecApp.name] = {
          ...(updateConfig[fecApp.name] || {}),
          packages: [
            ...updateConfig[fecApp.name]?.packages || [],
            packageToUpdate
          ],
          repoPath: fecApp.repoPath
        };
      }
    });
  });

  return updateConfig;
};

export default async ({ flags: { app, packages } }, { apps }) => {
  introLog();

  if (!app || !packages) {
    log.error(`${!app ? 'Application name' : 'Package name(s)'} was not provided. Make sure to pass it!`);
    process.exit(1);
  }

  if (!apps.some(element => element.name === app)) {
    log.error('Please make sure to pass correct application name and the app is installed locally!');
    process.exit(1);
  }

  const chromeApp = apps.find(({ name }) => name === 'insights-chrome');

  // We need latest prod dep versions
  checkoutBranch(chromeApp.repoPath, 'upstream', chromeApp.prodBranch);
  pullBranch(chromeApp.repoPath, 'upstream', chromeApp.prodBranch);

  if (chromeApp?.repoPath === undefined) {
    log.warn('insights-chrome is not installed. Please, install the package and try again.');
  } else {
    const appsUpdateConfig = buildUpdateConfig(apps, app, packages);

    // TODO: automate committing and pushing into GH branch
    log.plain('All version are being updated! Please do not forget to commit the changes and push into prod');
    await updatePackages(appsUpdateConfig);
  }
};
