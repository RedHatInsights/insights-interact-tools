import { runSubcommand } from '../../lib/commandHelpers.js';
import packageUpdate from './packageUpdate.js';
import script from './script.js';
import performance from './performance.js';

export default runSubcommand({
  packageUpdate,
  script,
  performance
}, script);
