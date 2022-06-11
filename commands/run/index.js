import packageUpdate from './packageUpdate.js';

export default async ([command], cli, config) =>
  ({
    packageUpdate
  }[command] || (() => ({})))(cli, config);
