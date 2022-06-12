import { runSubcommand } from '../../lib/commandHelpers.js';
import init from './init.js';
import apps from './apps.js';

export default runSubcommand({
  apps,
  init
}, init);
