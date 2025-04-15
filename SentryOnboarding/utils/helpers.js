import fs from 'fs';
import { execSync } from 'child_process';

export async function cloneRepo(repoUrl, clonePath) {
  try {
    if (!fs.existsSync(clonePath)) {
      console.log(`Cloning ${repoUrl}`);
      execSync(`git -c http.sslVerify=false clone --depth 1 ${repoUrl} ${clonePath}`, { stdio: 'inherit' });
    } else {
      execSync(`cd ${clonePath} && git pull`, { stdio: 'inherit' });
    }
  } catch (err) {
    console.error(`Git error: ${err.message}`);
    process.exit(1);
  }
}

export function extractProdStableRef(filePath, appName) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  let inApp = false;
  let inProdStable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith(`- name: ${appName}`)) {
      inApp = true;
      inProdStable = false;
    } else if (trimmed.startsWith('- name:') && !trimmed.includes(appName)) {
      inApp = false;
    }

    if (inApp && trimmed.includes('Prod Stable')) inProdStable = true;

    if (inApp && inProdStable && trimmed.startsWith('ref:')) {
      const hash = trimmed.split('ref:')[1].trim();
      if (/^[a-f0-9]{40}$/.test(hash)) {
        return hash;
      }
    }
  }

  console.error(`No valid ref found for ${appName}`);
  return null;
}

export function loadHashes(filePath) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  const fallback = process.env.COMMIT_HASHES_JSON || '{}';
  try {
    return JSON.parse(fallback);
  } catch {
    return {};
  }
}

export function saveHashes(filePath, hashes) {
  fs.writeFileSync(filePath, JSON.stringify(hashes, null, 2));
  console.log('Updated commit hashes saved.');
}