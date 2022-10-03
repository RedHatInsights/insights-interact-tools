import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import { appendFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { login } from '../../lib/helpers.js';
import { insightUrls } from '../../lib/performanceUrls.js';
import path from 'path';
import Table from 'cli-table';

export const flags = {
  filetype: {
    type: 'string',
    alias: ['ft'],
    description: 'Output file type [csv, json, html]'
  },
  oneFile: {
    type: 'boolean',
    alias: ['oF'],
    description: 'Put performance results into one file'
  },
  username: {
    type: 'string',
    alias: ['user'],
    description: 'Username to login in performance script'
  },
  password: {
    type: 'string',
    alias: ['pw'],
    description: 'Username to login in performance script'
  }
};

export const help = `
  Run Lighthouse performance tests agains apps.
`;

// Lighthouse viewer : https://googlechrome.github.io/lighthouse/viewer/  to view jsons.
// To view html, you can go to the same URL, or simple run a Live Server with the html file

// This port will be used by Lighthouse later. The specific port is arbitrary.
const PORT = 8041;
const dir = './report/lighthouse';
const metrics = [
  'Performance',
  'Accessibility',
  'Best-Practices',
  'SEO',
  'PWA'
];

/**
 * @param {array} insightsRepos
 * @param {string} fileType `csv, json, html`
 * @param {boolean} oneFile `Do you want one big file, or individual files for every url? `
 */
export default async ({ flags: { fileType, oneFile, username, password } }) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true }, (err) => {
      console.log(err);
    });
  }
  // Direct Puppeteer to open Chrome with a specific debugging port.
  const browser = await puppeteer.launch({
    args: [`--remote-debugging-port=${PORT}`],
    // Optional, if you want to see the tests in action.
    headless: false,
    slowMo: 50
  });
  await login(browser, 'https://console.stage.redhat.com/insights/dashboard', username, password);

  for (const app in insightUrls) {
    for (let i = 0; i < app.length; i++) {
      const currentUrl = insightUrls[app][i];
      console.log(`Currently generating ${fileType} report for ` + currentUrl);
      if (currentUrl !== undefined) {
        const results = await lighthouse(currentUrl, {
          port: PORT,
          disableStorageReset: true,
          output: `${fileType}`,
          screenEmulation: { width: 1000, height: 1000 }
          // logLevel: 'info'
        });
        const values = Object.values(results.lhr.categories).map(
          (c) => c.score * 100
        );
        let color;
        if (values[0] >= 80) {
          color = 'green';
        } else if (values[0] < 80 && values[0] >= 50) {
          color = 'orange';
        } else {
          color = 'red';
        }
        const table = new Table({
          chars: {
            top: '═',
            'top-mid': '╤',
            'top-left': '╔',
            'top-right': '╗',
            bottom: '═',
            'bottom-mid': '╧',
            'bottom-left': '╚',
            'bottom-right': '╝',
            left: '║',
            'left-mid': '╟',
            mid: '─',
            'mid-mid': '┼',
            right: '║',
            'right-mid': '╢',
            middle: '│'
          },
          style: { head: [color] },
          head: metrics
        });
        table.push(values);
        console.log(table.toString());

        if (oneFile) {
          const newPath = path.join(
            process.cwd(),
            'report/lighthouse/AllInsightsApps'
          );
          await appendFileSync(`${newPath}.${fileType}`, results.report);
        } else {
          const newPath = path.join(
            process.cwd(),
            `report/lighthouse/${app}${i + 1}.${fileType}`
          );
          await writeFileSync(newPath, results.report);
        }
      }
    }
    console.log(`Done with ${app}`);
  }
  await browser.close();
};
