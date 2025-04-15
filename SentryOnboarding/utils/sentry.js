import { execSync } from 'child_process';

export function triggerGitHubWorkflow(repoUrl, commitHash, workflowFileName) {
  const repoName = repoUrl.split('/').slice(-2).join('/').replace('.git', '');
  try {
    execSync(
      `curl -X POST -H "Accept: application/vnd.github+json" \
         -H "Authorization: Bearer ${process.env.GITHUB_TOKEN}" \
         https://api.github.com/repos/${repoName}/actions/workflows/${workflowFileName}/dispatches \
         -d '{"ref": "master", "inputs": {"commit_hash": "${commitHash}"}}'`,
      { stdio: 'inherit' }
    );
  } catch (err) {
    console.error(`Workflow error for ${repoName}: ${err.message}`);
  }
}

