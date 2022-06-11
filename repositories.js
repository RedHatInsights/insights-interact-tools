import { execAsync } from './lib/helpers.js';

export default {
  'insights-chrome': {
    owner: 'RedHatInsights',
    repo: 'insights-chrome'
  },
  'frontend-components': {
    owner: 'RedHatInsights',
    repo: 'frontend-components'
  },
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
  }
  // TODO add missing apps
};
