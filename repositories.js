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
  compliance: {
    owner: 'RedHatInsights',
    repo: 'compliance-frontend',
    onPackageUpdateComplete: async (_cli, _config, { repoPath }) => {
      await execAsync('npm run test -- -u', {
        cwd: repoPath
      });
    }
  },
  patch: {
    owner: 'RedHatInsights',
    repo: 'patchman-ui'
  },
  advisor: {
    owner: 'RedHatInsights',
    repo: 'insights-advisor-frontend',
    // $CHROME_PATH should be replaced by the withChrome command and insert the proper path
    withChrome: 'INSIGHTS_CHROME=$CHROME_PATH'
  },
  vulnerability: {
    owner: 'RedHatInsights',
    repo: 'vulnerability-ui'
  },
  malware: {
    owner: 'RedHatInsights',
    repo: 'malware-detection-frontend'
  },
  inventory: {
    owner: 'RedHatInsights',
    repo: 'insights-inventory-frontend'
  },
  drift: {
    owner: 'RedHatInsights',
    repo: 'drift-frontend'
  },
  'insights-dashboard': {
    owner: 'RedHatInsights',
    repo: 'insights-dashboard'
  },
  'rhc-dashboard': {
    owner: 'RedHatInsights',
    repo: 'sed-frontend'
  },
  remediations: {
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
  tasks: {
    owner: 'RedHatInsights',
    repo: 'tasks-frontend'
  }
};

export default {
  ...framework,
  ...apps
};
