import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import emoji from 'node-emoji';
import art from 'ascii-art';
import { log } from './helpers.js';
import { readConfig } from './configHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const asciiHeader = async () => {
  try {
    const rendered = await art.font('Insights Interact', 'doom').completed();
    log.chalk('redBright', '\n' + rendered + '\n');
  } catch (err) {
    // err is an error
  }
};

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

    log.plain('\n', emoji.get('heart'), '  All done! Have a nice day!', '\n');
  }
};

export const usage = () => {
  const readme = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8');
  const markedReadme = marked.lexer(readme);
  return markedReadme[markedReadme.findIndex(({ text }) => text === 'CLI Usage') + 1].raw.replace(/`/g, '');
};

export const commandNotImplemented = () =>
  ({ input }) => {
    log.info('Sorry, "' + input.join(' ') + '" not implemented');
  };

export const runSubcommand = (commands) => async ([command], cli, config) =>
  (commands[command] || commandNotImplemented(command))(cli, config);
