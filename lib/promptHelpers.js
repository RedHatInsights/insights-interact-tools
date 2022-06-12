import enquirer from 'enquirer';
import { apps } from '../repositories.js';

const { Toggle, MultiSelect, Select, Input } = enquirer;

const appNames = Object.entries(apps).map(([name]) => (name)).sort();
const appChoices = appNames.map((name) => ({ name, value: name }));

const allOrSelectedApps = async () => {
  const prompt = new Select({
    name: 'allOrSelected',
    hint: 'All applications would be: ' + (appChoices.map(({ name }) => (name)).join(', ')),
    message: 'Should it be configured for all applications or only selected ones?',
    choices: ['All', 'Selected']
  });

  return prompt.run();
};

export const selectApplications = async (options = {}, preselection = []) => {
  const all = await allOrSelectedApps();
  if (all === 'Selected') {
    const prompt = new MultiSelect({
      name: 'value',
      message: 'Select the applications',
      hint: 'Use SPACE to make a selection',
      choices: appChoices,
      initial: preselection.map((app) => appChoices.findIndex(({ name }) => name === app)),
      ...options
    });

    return await prompt.run();
  } else {
    return appNames;
  }
};

export const inputPrompt = async (message, initial = '', options = {}) => {
  const prompt = new Input({
    message,
    initial,
    ...options
  });

  return prompt.run();
};

export const togglePrompt = async (message = 'Question?', enabled = 'Yes', disabled = 'No', options = {}) => {
  const prompt = new Toggle({
    message,
    enabled,
    disabled,
    ...options
  });

  return prompt.run();
};
