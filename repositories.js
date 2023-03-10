import { execAsync } from './lib/helpers.js';

export const framework = {
  'insights-chrome': {
    owner: 'RedHatInsights',
    repo: 'insights-chrome'
  },
  'frontend-components': {
    owner: 'RedHatInsights',
    repo: 'frontend-components'
  }
};

export const apps = {
  'compliance-frontend': {
    owner: 'RedHatInsights',
    repo: 'compliance-frontend',
    onPackageUpdateComplete: async (_cli, _config, { repoPath }) => {
      await execAsync('npm run test -- -u', {
        cwd: repoPath
      });
    }
  },
  'insights-chrome': {
    owner: 'RedHatInsights',
    repo: 'insights-chrome',
    prodBranch: 'prod-stable'
  },
  'patchman-ui': {
    owner: 'RedHatInsights',
    repo: 'patchman-ui'
  },
  'insights-advisor-frontend': {
    owner: 'RedHatInsights',
    repo: 'insights-advisor-frontend',
    // $CHROME_PATH should be replaced by the withChrome command and insert the proper path
    withChrome: 'INSIGHTS_CHROME=$CHROME_PATH'
  },
  'vulnerability-ui': {
    owner: 'RedHatInsights',
    repo: 'vulnerability-ui'
  },
  'malware-detection-frontend': {
    owner: 'RedHatInsights',
    repo: 'malware-detection-frontend'
  },
  'insights-inventory-frontend': {
    owner: 'RedHatInsights',
    repo: 'insights-inventory-frontend'
  },
  'drift-frontend': {
    owner: 'RedHatInsights',
    repo: 'drift-frontend'
  },
  'insights-dashboard': {
    owner: 'RedHatInsights',
    repo: 'insights-dashboard'
  },
  'sed-frontend': {
    owner: 'RedHatInsights',
    repo: 'sed-frontend'
  },
  'insights-remediations-frontend': {
    owner: 'RedHatInsights',
    repo: 'insights-remediations-frontend'
  },
  'ocp-advisor': {
    owner: 'RedHatInsights',
    repo: 'ocp-advisor-frontend'
  },
  vuln4shift: {
    owner: 'RedHatInsights',
    repo: 'vuln4shift-frontend'
  },
  'tasks-frontend': {
    owner: 'RedHatInsights',
    repo: 'tasks-frontend'
  }
};

export default {
  ...framework,
  ...apps
};
