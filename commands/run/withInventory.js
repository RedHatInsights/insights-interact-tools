import chalk from 'chalk';
import intersection from 'lodash/intersection.js';
import { exec } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { selectApplications } from '../../lib/promptHelpers.js';

const inventoryApps = [
  'compliance',
  'drift',
  // 'edge',
  'remediations',
  'malware',
  'patch',
  // 'ros',
  'connector',
  'tasks',
  'vulnerability',
  'advisor'
];

export const flags = {
  debug: {
    type: 'boolean',
    alias: ['d'],
    description: 'Display more information about the running processes.'
  }
};

export const help = `
  Run multiple apps together with Inventory to test federated modules.
`;

export default async ({ flags: { debug } }, { basePath }) => {
  console.log('This script lets you run Inventory together with other apps that import some of the Inventory federated modules.');
  const installed = intersection(readdirSync(basePath), inventoryApps);

  if (!readdirSync(basePath).includes('inventory')) {
    console.log(
      chalk.yellow(`You must have inventory configured at ${basePath} first.`)
    );
    return;
  }

  const selections = await selectApplications(
    undefined,
    undefined,
    installed.map((app) => ({ name: app }))
  );

  // construct LOCAL_API env variable
  let port = 8004;
  let localApi = '';

  selections.forEach(async (app, index) => {
    // calculate port number for another app
    localApi += `${app}:${port}~https`;

    if (index !== selections.length - 1) {
      localApi += ',';
    }

    // TODO: let user decide to run beta or stable release
    const cmd = `PROXY=true INSIGHTS_ENV=stage CHROME_ENV=stage-beta BETA=true npx webpack serve --config config/dev.webpack.config.js --port ${port}`;
    console.log(`Running ${chalk.bold(app)} on port ${port} (${cmd})...`);

    const p = exec(cmd, { cwd: `${basePath}/${app}` });

    if (debug) {
      p.stdout?.pipe(process.stdout);
    }

    port++;
  });

  const cmd = `LOCAL_API=${localApi} PROXY=true ENVIRONMENT=stage BETA=true npx webpack serve --config config/dev.webpack.config.js`;

  console.log(`\nRunning ${chalk.bold('inventory')} on port 1337 (${cmd})...`);
  console.log(
    chalk.blue(
      '\nWait a bit before the build is finished and served. Use Ctrl+C to stop the script.'
    )
  );

  const i = exec(cmd, { cwd: `${basePath}/inventory` });

  if (debug) {
    i.stdout?.pipe(process.stdout);
  }
};
