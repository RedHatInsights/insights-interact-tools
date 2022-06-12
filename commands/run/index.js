import { runSubcommand } from '../../lib/commandHelpers.js';
import packageUpdate from './packageUpdate.js';
import script from './script.js';

export default runSubcommand({
  packageUpdate,
  script
}, script);
