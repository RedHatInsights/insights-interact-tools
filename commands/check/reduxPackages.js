import chalk from 'chalk';
import { drawTable, log } from '../../lib/helpers.js';
import { list } from '../../lib/npmHelpers.js';

const introLog = () => {
  log.plain('Checking for redux and react-redux libraries compliance with insights-chrome...');
};

const mapVersions = (packages) => packages.reduce((prev, cur) => ({ ...prev, [cur.name]: cur.version }), {});

const mapColor = (fst, snd) => fst === undefined
  ? chalk.green('-')
  : fst === snd
    ? chalk.green(fst)
    : chalk.red(fst);

export default async (cli, { apps }) => {
  introLog();

  const chromePath = apps.find(({ name }) => name === 'insights-chrome')?.repoPath;

  if (chromePath === undefined) {
    log.warn('insights-chrome is not installed. Please, install the package and try again.');
  } else {
    const chromeVersions = mapVersions(await list(chromePath, 'redux react-redux --depth=0'));
    const rows = [['insights-chrome', chromeVersions.redux, chromeVersions['react-redux']]];

    for (const app of apps.filter(({ name }) => name !== 'insights-chrome')) {
      const versions = mapVersions(await list(app.repoPath, 'react-redux redux --depth=0'));

      rows.push([
        app.name,
        mapColor(versions.redux, chromeVersions.redux),
        mapColor(versions['react-redux'], chromeVersions['react-redux'])
      ]);
    }

    drawTable(['Application', 'redux', 'react-redux'], rows);
  }
};
