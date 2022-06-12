import enquirer from 'enquirer';
import { log } from '../../lib/helpers.js';
import { asciiHeader } from '../../lib/commandHelpers.js';
import { appChoices, selectApplications } from '../../lib/promptHelpers.js';
const { Select } = enquirer;

const allOrSelectedApps = async () => {
  const prompt = new Select({
    name: 'allOrSelected',
    hint: 'All applications would be: ' + (appChoices.map(({ name }) => (name)).join(', ')),
    message: 'Should it be configured for all applications or only selected ones?',
    choices: ['All', 'Selected']
  });

  return await prompt.run();
};

const compileConfigFileContents = async ({ apps, basePath = '', githubUser = '' }) => {
  return `
export default {
  basePath: '${basePath}',
  githubUser: '${githubUser}',
  apps: [${apps.map((app) => (`'${app}'`)).join(', ')}]
};
`;
};

export default async (cli, config) => {
  await asciiHeader();
  log.plain('Ahoy!\n');
  log.plain('This wizard will guide you through creating a config file for setting up Insights frontend applications.\n');
  // TODO read the raw/uncompiled config if given for preselecting choices
  const allOrSelected = await allOrSelectedApps();
  if (allOrSelected === 'All') {

  } else {
    const apps = await selectApplications('to configure');
    const contents = await compileConfigFileContents({ apps });
    log.chalk('blueBright', contents);
  }
};
