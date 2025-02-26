import fs from 'fs';
import { execSync } from 'child_process';

// Path is the relative path to deploy ref in app interface
// githubRepo is the https github clone link
// workflowTrigger is the api trigger to commence the github job
// appName is the appName in app-interace
// workflowFileName is the file where the sentry workflow resides
const filesToMonitor = [
  {
    path: 'data/services/insights/advisor/deploy.yml',
    githubRepo: 'https://github.com/RedHatInsights/insights-advisor-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'advisor-frontend',
    workflowFileName: 'webpack.yml'
  },
  {
    path: 'data/services/insights/host-inventory/deploy-clowder.yml',
    githubRepo: 'https://github.com/RedHatInsights/insights-inventory-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'host-inventory-frontend',
    workflowFileName: 'main.yml'
  },
  {
    path: 'data/services/insights/compliance/deploy.yml',
    githubRepo: 'https://github.com/RedHatInsights/compliance-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'compliance-frontend',
    workflowFileName: 'main.yml'
  },
  {
    path: 'data/services/insights/frontend-base/deploy.yml',
    githubRepo: 'https://github.com/RedHatInsights/insights-chrome.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'insights-chrome',
    workflowFileName: 'sentry.yml'
  },
  {
    path: 'data/services/insights/frontend-base/deploy.yml',
    githubRepo: 'https://github.com/RedHatInsights/insights-dashboard.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'insights-dashboard',
    workflowFileName: 'sentry.yml'
  },
  {
    path: 'data/services/insights/patchman/deploy-clowder.yml',
    githubRepo: 'https://github.com/RedHatInsights/patchman-ui.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'patchman-ui',
    workflowFileName: 'sentry.yml'
  },
  {
    path: 'data/services/insights/remediations/deploy-clowder.yml',
    githubRepo: 'https://github.com/RedHatInsights/insights-remediations-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'remediations',
    workflowFileName: 'sentry.yml'
  },
  {
    path: 'data/services/insights/vulnerability/deploy-clowder.yml',
    githubRepo: 'https://github.com/RedHatInsights/vulnerability-ui.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'vulnerability-ui',
    workflowFileName: 'sentry.yml'
  },
  {
    path: 'data/services/insights/malware-detection/deploy.yml',
    githubRepo: 'https://github.com/RedHatInsights/malware-detection-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'malware-detection-frontend',
    workflowFileName: 'sentry.yml'
  },
  {
    path: 'data/services/insights/policies/deploy-clowder.yml',
    githubRepo: 'https://github.com/RedHatInsights/policies-ui-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'policies',
    workflowFileName: 'sentry.yml'
  },
  {
    path: 'data/services/insights/ocp-vulnerability/deploy.yml',
    githubRepo: 'https://github.com/RedHatInsights/vuln4shift-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'vuln4shift-frontend',
    workflowFileName: 'sentry.yml'
  },
  {
    path: 'data/services/insights/ccx-data-pipeline/deploy.yml',
    githubRepo: 'https://github.com/RedHatInsights/ocp-advisor-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'ocp-advisor',
    workflowFileName: 'sentry.yml'
  },
  {
    path: 'data/services/insights/advisor/deploy.yml',
    githubRepo: 'https://github.com/RedHatInsights/tasks-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'tasks-frontend',
    workflowFileName: 'sentry.yml'
  },
  {
    path: 'data/services/insights/frontend-base/deploy.yml',
    githubRepo: 'https://github.com/RedHatInsights/registration-assistant.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'registration-assistant',
    workflowFileName: 'sentry.yml'
  },
  {
    path: 'data/services/insights/config-manager/deploy.yml',
    githubRepo: 'https://github.com/RedHatInsights/sed-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'sed-frontend',
    workflowFileName: 'sentry.yml'
  }
];

const repoPath = '/tmp/app-interface';
const repoUrl = 'https://gitlab.cee.redhat.com/service/app-interface.git';
const hashesFilePath = `${process.env.CI_PROJECT_DIR || '.'}/commit_hashes.json`;

async function cloneRepo (repoUrl, clonePath) {
  try {
    if (!fs.existsSync(clonePath)) {
      console.log(`Cloning repository: ${repoUrl}`);
      execSync(`git -c http.sslVerify=false clone --depth 1 ${repoUrl} ${clonePath}`, { stdio: 'inherit' });
      console.log('Repository cloned successfully.');
    } else {
      console.log('Repository already exists. Pulling latest changes.');
      execSync(`cd ${clonePath} && git pull`, { stdio: 'inherit' });
    }
  } catch (err) {
    console.error('Error cloning repository:', err.message);
    process.exit(1);
  }
}

async function buildInsightsChromeLocally (commitHash) {
  const chromeRepoUrl = 'https://github.com/RedHatInsights/insights-chrome.git';
  const localPath = '/tmp/insights-chrome';

  try {
    if (!fs.existsSync(localPath)) {
      console.log(`Cloning insights-chrome repository: ${chromeRepoUrl}`);
      execSync(`git clone ${chromeRepoUrl} ${localPath}`, { stdio: 'inherit' });
    } else {
      console.log('Repository already exists. Pulling latest changes.');
      execSync(`git reset --hard origin/main && git fetch --all && cd ${localPath} `, { stdio: 'inherit' });
    }

    // Checkout commit
    console.log(`Checking out commit hash: ${commitHash}`);
    execSync(`cd ${localPath} && git checkout ${commitHash}`, { stdio: 'inherit' });

    // Install deps
    console.log('Installing dependencies...');
    execSync(`cd ${localPath} && npm ci`, { stdio: 'inherit' });

    // Build the project with Sentry environment variables
    console.log('Building the project...');
    execSync(
      `cd ${localPath} && npm run build`,
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          SENTRY_RELEASE: `${commitHash}`,
          SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN_CHROME,
          SENTRY_ORG: 'red-hat-it',
          SENTRY_PROJECT: 'cpin-001-insights',
          ENABLE_SENTRY: true
        }
      }
    );

    console.log('Build completed successfully.');
  } catch (err) {
    console.error('Error building insights-chrome locally:', err.message);
    process.exit(1);
  }
}

function extractProdStableRef (filePath, appName) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    let inAppSection = false;
    let inProdStableSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith(`- name: ${appName}`)) {
        inAppSection = true;
        inProdStableSection = false;
      }

      if (inAppSection && trimmedLine.startsWith('- name:') && !trimmedLine.includes(appName)) {
        inAppSection = false;
        inProdStableSection = false;
      }

      if (inAppSection && trimmedLine.includes('Prod Stable')) {
        inProdStableSection = true;
      }

      if (inAppSection && inProdStableSection && trimmedLine.startsWith('ref:')) {
        const potentialHash = trimmedLine.split('ref:')[1].trim();
        if (/^[a-f0-9]{40}$/.test(potentialHash)) {
          console.log(`Valid commit hash found: ${potentialHash}`);
          return potentialHash;
        }
      }
    }
    console.error(`No valid commit hash found in "Prod Stable" section for app: ${appName}`);
    return null;
  } catch (err) {
    console.error(`Error extracting ref for app ${appName} from ${filePath}:`, err.message);
    return null;
  }
}

function loadHashes () {
  if (fs.existsSync(hashesFilePath)) {
    console.log(`Loading hashes from ${hashesFilePath}`);
    return JSON.parse(fs.readFileSync(hashesFilePath, 'utf-8'));
  }

  const envHashes = process.env.COMMIT_HASHES_JSON || '{}';
  try {
    return JSON.parse(envHashes);
  } catch (err) {
    console.error('Error parsing COMMIT_HASHES_JSON:', err.message);
    return {};
  }
}

function saveHashes (hashes) {
  console.log(`Saving updated hashes to ${hashesFilePath}`);
  fs.writeFileSync(hashesFilePath, JSON.stringify(hashes, null, 2));

  console.log('Exporting updated hashes to COMMIT_HASHES_JSON environment variable.');
  console.log(JSON.stringify(hashes));
}

function triggerGitHubWorkflow (repoUrl, commitHash, workflowFileName) {
  const repoName = repoUrl.split('/').slice(-2).join('/').replace('.git', '');
  try {
    console.log(`Triggering workflow for ${repoUrl} with commit hash ${commitHash} using workflow file ${workflowFileName}`);
    execSync(
      `curl -X POST -H "Accept: application/vnd.github+json" \
         -H "Authorization: Bearer ${process.env.GITHUB_TOKEN}" \
         https://api.github.com/repos/${repoName}/actions/workflows/${workflowFileName}/dispatches \
         -d '{"ref": "master", "inputs": {"commit_hash": "${commitHash}"}}'`,
      { stdio: 'inherit' }
    );
    console.log(`Workflow triggered for ${repoUrl} with commit hash ${commitHash}`);
  } catch (err) {
    console.error(`Error triggering GitHub workflow for ${repoUrl} with file ${workflowFileName}:`, err.message);
  }
}

async function main () {
  await cloneRepo(repoUrl, repoPath);

  const hashes = loadHashes();

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
        // Not an admin for chrome so we need to do this locally
        if (appName === 'insights-chrome') {
          console.log('Building insights-chrome locally...');
          await buildInsightsChromeLocally(commitHash);
        } else {
          console.log(`Triggering workflow for ${appName}.`);
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

  saveHashes(hashes);
}

main();
