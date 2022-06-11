// TODO all these command/XYZ/index.js look the same maybe we can refactor this and even avoid an index.js
import packages from './packages.js';

export default async ([command], cli, config) =>
  ({
    packages
  }[command])(cli, config);
