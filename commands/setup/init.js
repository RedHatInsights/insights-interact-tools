import chalk from 'chalk';
import YAML from 'yaml';
import { log, readGHuser } from '../../lib/helpers.js';
import { configHomePath, readConfigFile, saveConfigFile } from '../../lib/configHelpers.js';
import { asciiHeader } from '../../lib/commandHelpers.js';
import { selectApplications, inputPrompt, togglePrompt } from '../../lib/promptHelpers.js';

const setConfigPath = () =>
  inputPrompt(
    'Where should the config file by saved to?',
    configHomePath,
    {
      validate: (value) => (
        !value.endsWith('.yml') && !value.endsWith('.yaml') ? 'File must a YAML (.yml or .yaml).' : true
      )
    }
  );

const confirmedSaveConfigFile = async (contents) => {
  const saveToHome = await togglePrompt(
    'Want to save the config file to ' + chalk.bold(configHomePath),
    'Yes', 'No',
    { initial: true }
  );
  const savePath = saveToHome ? configHomePath : await setConfigPath();

  await saveConfigFile(savePath, contents);
};

export default async (cli, config) => {
  await asciiHeader();
  log.plain('Ahoy!\n');
  log.plain('This wizard will guide you through creating a config file for setting up Insights frontend applications.\n');

  const currentConfig = await readConfigFile(configHomePath);
  const apps = await selectApplications({
    message: 'Select the applications to configure'
  }, currentConfig.apps);
  const basePath = await inputPrompt('Where should the applications be set up?', (currentConfig.basePath || process.env.HOME));
  const githubUser = await inputPrompt('What is your GitHub username?', (currentConfig.githubUser || readGHuser())); ;
  const contents = YAML.stringify({ apps, basePath, githubUser });

  log.plain('\n');
  log.info('The config file will look like this:');
  log.chalk('blueBright', contents);

  confirmedSaveConfigFile(contents);
};
