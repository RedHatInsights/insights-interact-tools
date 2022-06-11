import path from 'node:path';

const basePath = path.join(process.env.HOME, '/Projects/RedHat/console');

export default {
  basePath,
  githubUser: 'bastilian',
  apps: [
    'compliance',
    { name: 'advisor' },
    'patch',
    // { name: 'vulnerability', localChrome: true },
    { name: 'malware', 'frontend-components': true }
  ]
};
