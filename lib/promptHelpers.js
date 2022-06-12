import enquirer from 'enquirer';
import { apps } from '../repositories.js';

const { MultiSelect, Select } = enquirer;

export const appChoices = Object.entries(apps).map(([name]) => (name)).sort().map((name) => ({ name, value: name }));

export const selectApplications = async (msgExtension = '') => {
  const prompt = new MultiSelect({
    name: 'value',
    message: 'Select the applications ' + msgExtension,
    hint: 'Use SPACE to make a selection',
    choices: appChoices
    // initial: 1, TODO use to preselect already installed applications
  });

  const answers = await prompt.run();
  console.log(answers);
  return answers;
};
