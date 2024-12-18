import fs, { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const filesToMonitor = [
  {
    path: 'data/services/insights/advisor/deploy.yml',
    githubRepo: 'https://github.com/RedHatInsights/insights-advisor-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'advisor-frontend' // The app name has to match in the file in app-interface !!
  },
  {
    path: 'data/services/insights/host-inventory/deploy-clowder.yml',
    githubRepo: 'https://github.com/RedHatInsights/insights-inventory-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'host-inventory-frontend'
  },
  {
    path: 'data/services/insights/compliance/deploy.yml',
    githubRepo: 'https://github.com/RedHatInsights/compliance-frontend.git',
    workflowTrigger: 'workflow_dispatch',
    appName: 'compliance-frontend'
  }
];

const repoPath = '/tmp/app-interface';
const repoUrl = 'https://gitlab.cee.redhat.com/service/app-interface.git';
const hashesFilePath = './commit_hashes.json';

async function cloneRepo (repoUrl, clonePath) {
  try {
    if (!fs.existsSync(clonePath)) {
      console.log(`Cloning repository: ${repoUrl}`);
      execSync(`git clone --depth 1 ${repoUrl} ${clonePath}`, { stdio: 'inherit' });
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

// This is long because theres a lot of files, like advisor, where multpile apps live. So we have to account for each edgecase
// Not all of the deploy files have the same comments/structure
function extractProdStableRef (filePath, appName) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    let inAppSection = false;
    let inProdStableSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check for the start of the app section
      if (trimmedLine.startsWith(`- name: ${appName}`)) {
        inAppSection = true;
        inProdStableSection = false; // Reset the Prod Stable flag when entering the app section
      }

      // Exit the app section if another app section starts
      if (inAppSection && trimmedLine.startsWith('- name:') && !trimmedLine.includes(appName)) {
        inAppSection = false;
        inProdStableSection = false; // Ensure we exit the Prod Stable section as well
      }

      // If in the correct app section, check for "Prod Stable" dynamically
      if (inAppSection && trimmedLine.includes('Prod Stable')) {
        inProdStableSection = true;
      }

      // If inside the "Prod Stable" section, look for a ref
      if (inAppSection && inProdStableSection && trimmedLine.startsWith('ref:')) {
        const potentialHash = trimmedLine.split('ref:')[1].trim();

        // Validate if it's a commit hash (SHA-1: 40 characters, hex only)
        if (/^[a-f0-9]{40}$/.test(potentialHash)) {
          console.log(`Valid commit hash found: ${potentialHash}`);
          return potentialHash;
        } else {
          console.log(`Invalid hash format: ${potentialHash}`);
        }
      }

      // Exit the "Prod Stable" section only when another app's section starts
      if (inAppSection && inProdStableSection && trimmedLine.startsWith('- name:')) {
        inProdStableSection = false;
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
    return JSON.parse(readFileSync(hashesFilePath, 'utf-8'));
  }
  return {};
}

function saveHashes (hashes) {
  writeFileSync(hashesFilePath, JSON.stringify(hashes, null, 2));
}

function triggerGitHubWorkflow (repoUrl, commitHash) {
  const repoName = repoUrl.split('/').slice(-2).join('/').replace('.git', '');
  const workflowFileName = 'webpack.yml';

  try {
    console.log(`Triggering workflow for ${repoUrl} with commit hash ${commitHash}`);
    execSync(
        `curl -X POST -H "Accept: application/vnd.github+json" \
         -H "Authorization: Bearer ${process.env.GITHUB_TOKEN}" \
         https://api.github.com/repos/${repoName}/actions/workflows/${workflowFileName}/dispatches \
         -d '{"ref": "master", "inputs": {"commit_hash": "${commitHash}"}}'`,
        { stdio: 'inherit' }
    );
    console.log(`Workflow triggered for ${repoUrl} with commit hash ${commitHash}`);
  } catch (err) {
    console.error('Error triggering GitHub workflow:', err.message);
  }
}
async function main () {
  await cloneRepo(repoUrl, repoPath);

  const hashes = loadHashes();

  for (const { path, appName, githubRepo } of filesToMonitor) {
    const filePath = `${repoPath}/${path}`;

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }

    const commitHash = extractProdStableRef(filePath, appName);

    if (commitHash) {
      console.log(`Commit hash for ${appName}: ${commitHash}`);

      // Check if the hash is different from the stored hash
      if (hashes[appName] !== commitHash) {
        console.log(`Hash has changed for ${appName}. Triggering GitHub workflow.`);
        triggerGitHubWorkflow(githubRepo, commitHash);
        hashes[appName] = commitHash; // Update the stored hash
      } else {
        console.log(`Hash has not changed for ${appName}. No workflow triggered.`);
      }
    } else {
      console.error(`No commit hash found for ${appName}.`);
    }
  }

  saveHashes(hashes); // Save updated hashes
}
main();
