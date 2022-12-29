import path from 'node:path';
import { readdirSync } from 'node:fs';
import meow from 'meow';
import chalk from 'chalk';
import emoji from 'node-emoji';
import { commandNotImplemented } from './commandHelpers.js';
import { readConfig } from './configHelpers.js';
import { log, buildTable } from './helpers.js';

const globalFlags = {
  config: {
    type: 'string',
    alias: 'c',
    description: 'Define a custom config (defaults to ~/.insights-interact.yml)'
  },
  debug: {
    type: 'boolean',
    alias: 'd',
    description: 'Enables further log output'
  }
  // TODO This should be a comma separated string of app names
  // It should be used to limit what app(s) the scripts run on
  // apps: {
  //   type: 'string',
  //   alias: ['app', 'a']
  // },
};

const importCommandModule = async (commandsPath, commandDirectory, moduleFile) => {
  const moduleFilePath = path.join(commandsPath, commandDirectory, moduleFile);

  try {
    const module = await import(moduleFilePath);
    const moduleName = module.commandName || moduleFile.replace('.js', '');
    return [moduleName, module];
  } catch (error) {
    console.log('Could not import: ', moduleFilePath);
    console.log(error);
    return [];
  }
};

const importCommandModules = async () => {
  const commandsPath = path.join(path.dirname(import.meta.url.replace('file:', '')), '../commands');
  const commandDirectories = readdirSync(commandsPath);
  const commandModules = {};

  for (const commandDirectory of commandDirectories) {
    const commandDirectoryModules = {};
    const moduleFiles = readdirSync(path.join(commandsPath, commandDirectory), { withFileTypes: true }).filter(({ name }) => name !== 'index.js');

    for (const { name: moduleFile } of moduleFiles) {
      const [moduleName, module] = await importCommandModule(commandsPath, commandDirectory, moduleFile);
      commandDirectoryModules[moduleName] = module;
    }

    commandModules[commandDirectory] = commandDirectoryModules;
  }

  return commandModules;
};

const getCommandModuleFlags = (commandModules) =>
  Object.entries(commandModules).flatMap(([_commandCategory, commandCategoryModules]) => {
    return Object.entries(commandCategoryModules).map(([_command, module]) => module.flags);
  }).filter((v) => !!v).reduce((flagObject, flag) => {
    return {
      ...flagObject,
      ...flag
    };
  }, {});

const renderFlags = (flags) => {
  const rows = Object.entries(flags).map(([flag, options]) => [
    '--' + flag,
    Array.isArray(options?.alias) ? options.alias.map((alias) => '-' + alias).join(', ') : '-' + options.alias,
    options.type,
    options.description || ''
  ]);

  return buildTable(['', '', '', ''], rows, 'plain');
};

const getCommandModulesHelp = (commandModules) => {
  return Object.entries(commandModules).flatMap(([commandModuleCategory, commandCategoryModules]) => {
    return [
      ...Object.entries(commandCategoryModules).flatMap(([commandName, module]) => {
        const flags = module.flags ? [chalk.bold('    Flags'), renderFlags(module.flags).split('\n').join('\n      ')] : [];
        return module.default && [
          chalk.bold(`\n  ${chalk.underline(commandModuleCategory + ' ' + commandName)}`),
          '  ' + (module.help || ''),
          ...flags
        ];
      }).filter((v) => (!!v && v.trim() !== ''))
    ];
  }).join('\n');
};

const generalUsage = `
${chalk.bold('USAGE')}

  $ insights-interact <command> <subcommand> [options]

${chalk.bold('GLOBAL FLAGS')}
  ${renderFlags(globalFlags).split('\n').join('\n  ')}
`;

const help = (commandModules) => {
  return `${generalUsage}\n${chalk.bold('COMMANDS')}\n\n${getCommandModulesHelp(commandModules)}`;
};

const run = async (cli, commandModules) => {
  const [command, subCommand] = cli.input;
  if (cli.flags.debug) { log.info('DEBUG', cli, commandModules); };

  if ((!command && !subCommand) || cli.flags.help) {
    cli.showHelp();
  } else {
    const commandModule = commandModules[command]?.[subCommand];
    const config = await readConfig(cli);

    if (!commandModule) {
      commandNotImplemented();
      cli.showHelp();
    };

    try {
      await commandModule.default(cli, config);
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    };

    if (!config.ialreadyhaveanicedaythankyou) {
      log.plain('\n', emoji.get('heart'), '  All done! Have a nice day!', '\n');
    } else {
      log.plain('\n');
    }
  }
};

export default async (workingDirectory) => {
  const commandModules = await importCommandModules();
  const commandFlags = getCommandModuleFlags(commandModules);
  const commandHelp = help(commandModules);

  const cli = meow(commandHelp, {
    importMeta: import.meta,
    description: false,
    autoHelp: false,
    flags: {
      ...globalFlags,
      ...commandFlags
    }
  });

  run({
    ...cli,
    workingDirectory,
    ...cli.flags.config ? { configPath: path.join(cli.flags.config) } : {}
  }, commandModules);
};
