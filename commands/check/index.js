import packages from './packages.js';

export default ([command], cli, config) =>
  ({
    packages
  }[command])(cli, config);
