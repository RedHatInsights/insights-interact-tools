import init from './init.js';

export default ([command], cli, config) =>
  ({
    init
  }[command] || init)(cli, config);
