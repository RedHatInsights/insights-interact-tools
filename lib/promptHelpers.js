import enquirer from 'enquirer';
import map from 'lodash/map.js';
import { apps, framework } from '../repositories.js';

const { Toggle, MultiSelect, Select, Input } = enquirer;

const appNames = Object.entries({ ...apps, ...framework }).map(([name]) => (name)).sort();
const appChoices = appNames.map((name) => ({ name, value: name }));

const allOrSelectedApps = async (choices = appChoices) => {
  const prompt = new Select({
    name: 'allOrSelected',
    hint: 'Available applications: ' + (choices.map(({ name }) => (name)).join(', ')),
    message: 'Select all or select only some applications?',
    choices: ['All', 'Selected']
  });

  return prompt.run();
};

export const selectApplications = async (options = {}, preselection = [], apps = appChoices) => {
  const all = await allOrSelectedApps(apps);

  if (all === 'Selected') {
    const prompt = new MultiSelect({
      name: 'value',
      message: 'Select the applications',
      hint: 'Use SPACE to make a selection',
      choices: apps,
      initial: preselection.map((app) => apps.findIndex(({ name }) => name === app)),
      ...options
    });

    return await prompt.run();
  } else {
    return map(apps, 'name');
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
