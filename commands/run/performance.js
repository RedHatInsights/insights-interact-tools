import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import { appendFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { insightUrls, login } from '../../lib/helpers.js';
import path from 'path';
import Table from 'cli-table';

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
export default async () => {
  const fileType =
    process.argv[4] && (process.argv[4] === 'csv' || 'html' || 'json')
      ? process.argv[4]
      : 'csv';
  const oneFile = !process.argv[5];

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
  await login(browser, 'https://console.stage.redhat.com/insights/dashboard');

  for (const app in insightUrls) {
    for (let i = 0; i < app.length; i++) {
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
        }
      });

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
          (c) => c.score
        );
        table.push(metrics, values);
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
