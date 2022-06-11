import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { marked } from 'marked';
import emoji from 'node-emoji';
import { log, readConfig } from '../commands/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const run = async (cli) => {
  if (cli.flags.debug) { console.log('CLI', cli); };
  if (cli.flags.help) {
    cli.showHelp();
  } else {
    const [command, ...subCommands] = cli.input;
    const commandModule = (await import(`../commands/${command}/index.js`)).default;
    const config = await readConfig(cli);

    try {
      await commandModule(subCommands, cli, config);
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    };

    console.log('\n', emoji.get('heart'), '  All done! Have a nice day!', '\n');
  }
};

export const usage = () => {
  const readme = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8');
  const markedReadme = marked.lexer(readme);
  return markedReadme[markedReadme.findIndex(({ text }) => text === 'CLI Usage') + 1].raw.replace(/`/g, '');
};
