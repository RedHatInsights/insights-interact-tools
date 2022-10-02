import { join } from 'node:path';
import command from './lib/command.js';

command(join(process.env.PWD));
