import path from 'node:path';
import meow from 'meow';
import { run, usage } from './lib/commandHelpers.js';

const currentPath = path.join(process.env.PWD);
const cli = meow(usage(), {
  importMeta: import.meta,
  description: false,
  flags: {
    config: {
      type: 'string',
      alias: 'c'
    },
    reset: {
      type: 'boolean',
      alias: 'r'
    },
    packagepattern: {
      type: 'string',
      alias: ['pp', 'p']
    },
    // TODO This should be a comma separated string of app names
    // It should be used to limit what app(s) the scripts run on
    apps: {
      type: 'string',
      alias: ['app', 'a']
    }
  }
});

run({
  ...cli,
  currentPath,
  configPath: path.join(currentPath, cli.flags.config)
});
