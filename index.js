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
      alias: 'pp'
    }
  }
});

run({
  ...cli,
  currentPath,
  configPath: path.join(currentPath, cli.flags.config)
});
