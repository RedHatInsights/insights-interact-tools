import { v4 as uuidv4 } from 'uuid';
import { githubRepoUrl, log, readJsonFile, readYmlFile, prepareGitRepo } from '../../lib/helpers.js';
import { framework as frameworkRepos } from '../../repositories.js';
import { update } from '../../lib/npmHelpers.js';
import { checkoutBranch, pullBranch, createPullRequest } from '../../lib/gitHelpers.js';
import { readdirSync } from 'node:fs';
import { configHomePath } from '../../lib/configHelpers.js';

export const flags = {
  app: {
    type: 'string',
    alias: ['a'],
    description: 'The application that you are going to align with the chrome app.'
  },
  packages: {
    type: 'string',
    alias: ['p'],
    description: 'The package that you are going to align the versions. If you would like to align multiple packages, you can use comma separated names'
  }
};

export const help = `
  This command helps you to align the versions of your packages to the chrome one.
`;

const introLog = () => {
  log.plain(`This will help you to align all versions including the the version of the same package in your immediate dependency to the chrome version.
   This is helpful to avoid duplicate package instances loaded into browser`);
};

const readPkgJson = (appFolder) => readJsonFile(`${appFolder}/package.json`);

const getAppData = (apps, app) => {
  let pkgJson; let appFolder; let appName; let gitRepoUrl;

  apps.forEach(({ name, repoPath, owner, repo }) => {
    const appData = readPkgJson(repoPath);
    if (appData.name === app) {
      pkgJson = appData;
      appFolder = repoPath;
      appName = name;
      gitRepoUrl = githubRepoUrl(owner, repo);
    }
  });

  return [
    pkgJson,
    appFolder,
    appName,
    gitRepoUrl
  ];
};

const findRhcApps = (apps, currentApp, appJson, pkgName) => {
  const allProdDeps = Object.keys(appJson.dependencies);

  const rhcDeps = allProdDeps.filter(dep =>
    dep.startsWith('@redhat-cloud-services/frontend-components')
  );

  const rhcApps = [];
  apps.forEach(app => {
    const { dependencies, name } = readPkgJson(app.repoPath) || {};

    if (rhcDeps.includes(name) && app.name !== currentApp.name) {
      rhcApps.push({
        ...app,
        pkgVersion: dependencies[pkgName]
      });
    }
  });

  return rhcApps;
};

const findFecDeps = (appJson, pkgName) => {
  const insightsToolConfig = readYmlFile(configHomePath);
  const fecPackagesPath = `${insightsToolConfig.basePath}/${frameworkRepos['frontend-components'].repo}/packages`;
  const fecDirs = readdirSync(fecPackagesPath).filter(dir => !dir.startsWith('.'));

  const allProdDeps = Object.keys(appJson.dependencies);

  const fecDeps = allProdDeps.filter(dep =>
    dep.startsWith('@redhat-cloud-services/frontend-components')
  );

  const fecUpdates = [];
  fecDirs.forEach(dir => {
    const packagePath = `${fecPackagesPath}/${dir}`;
    const { dependencies, name } = readPkgJson(packagePath);

    if (dependencies && dependencies[pkgName] && fecDeps.includes(name)) {
      fecUpdates.push({
        repoPath: packagePath,
        pkgVersion: dependencies[pkgName],
        name: packagePath
      });
    }
  });

  return fecUpdates;
};

const updatePackages = async (updateConfigs) => {
  const configs = Object.keys(updateConfigs);
  configs.forEach(async (config) => {
    const { repoPath, packages } = updateConfigs[config];

    const isRepoReady = prepareGitRepo(repoPath, `alignPackages-${uuidv4()}`);

    if (isRepoReady) {
      const isUpdateOk = await update(repoPath, packages, { isSpeficVersion: true });

      log.plain(isUpdateOk, repoPath);
      // isUpdateOk && createPullRequest(
      //   repoPath,
      //   'Align packages to chrome version',
      //   'This PR is intended to align package versions to the chrome dependency instance version'
      // );
    };
  });
};

const buildUpdateConfig = (apps, app, packages) => {
  const packagesArray = packages.split(',');

  const updateConfig = {};
  packagesArray.forEach(pkgName => {
    const [packageJson, folder, appName, gitRepoUrl] = getAppData(apps, app, pkgName);
    const [chromePkgJson] = getAppData(apps, frameworkRepos['insights-chrome'].repo);
    const chromeVersion = chromePkgJson.dependencies[pkgName];
    const packageToUpdate = `${pkgName}@${chromeVersion}`;

    if (!appName) {
      log.error('Please make sure to pass correct application name and the app is installed locally!');
      process.exit(1);
    }

    // build update config for the app itself
    if (packageJson[pkgName] !== chromeVersion) {
      updateConfig[appName] = {
        ...(updateConfig[appName] || {}),
        packages: [
          ...updateConfig[appName]?.packages || [],
          packageToUpdate
        ],
        repoPath: folder,
        gitRepoUrl
      };
    };

    // build update config for other peer dependant applications under @redhat-cloud-services namespace
    const rhcDeps = findRhcApps(apps, appName, packageJson, pkgName);
    rhcDeps.forEach(rhcApp => {
      if (rhcApp.pkgVersion !== chromeVersion) {
        updateConfig[rhcApp.name] = {
          ...(updateConfig[rhcApp.name] || {}),
          packages: [
            ...updateConfig[rhcApp.name]?.packages || [],
            packageToUpdate
          ],
          repoPath: rhcApp.repoPath,
          gitRepoUrl
        };
      }
    });

    // build update config for dependant fec-packages
    const fecDeps = findFecDeps(packageJson, pkgName);
    fecDeps.forEach(fecDeps => {
      if (fecDeps.pkgVersion !== chromeVersion) {
        updateConfig[fecDeps.name] = {
          ...(updateConfig[fecDeps.name] || {}),
          packages: [
            ...updateConfig[fecDeps.name]?.packages || [],
            packageToUpdate
          ],
          repoPath: fecDeps.repoPath,
          gitRepoUrl
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
