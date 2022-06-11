import { runSubcommand } from '../../lib/commandHelpers.js';
import outdatedPackages from './outdatedPackages.js';
import packages from './packages.js';

export default runSubcommand({
  outdatedPackages,
  packages
});
