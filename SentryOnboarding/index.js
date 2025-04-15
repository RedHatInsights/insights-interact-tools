import fs from 'fs';
import { buildInsightsChromeLocally, triggerGitHubWorkflow } from './utils/sentry.js';
import { loadHashes, saveHashes, cloneRepo, extractProdStableRef } from './utils/helpers.js';
import { filesToMonitor } from './repos.config.js';

const repoPath = '/tmp/app-interface';
const repoUrl = 'https://gitlab.cee.redhat.com/service/app-interface.git';
const hashesFilePath = `${process.env.CI_PROJECT_DIR || '.'}/SentryOnboarding/commit_hashes.json`;

async function main () {
  await cloneRepo(repoUrl, repoPath);
  const hashes = loadHashes(hashesFilePath);

  for (const { path, appName, githubRepo, workflowFileName } of filesToMonitor) {
    const filePath = `${repoPath}/${path}`;

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }

    const commitHash = extractProdStableRef(filePath, appName);

    if (commitHash) {
      console.log(`Commit hash for ${appName}: ${commitHash}`);

      if (hashes[appName] !== commitHash) {
        console.log(`Hash has changed for ${appName}.`);
        if (appName === 'insights-chrome') {
          await buildInsightsChromeLocally(commitHash);
        } else {
          triggerGitHubWorkflow(githubRepo, commitHash, workflowFileName);
        }
        hashes[appName] = commitHash;
      } else {
        console.log(`Hash has not changed for ${appName}. No action required.`);
      }
    } else {
      console.error(`No commit hash found for ${appName}.`);
    }
  }

  saveHashes(hashes, hashesFilePath);
}

main();
