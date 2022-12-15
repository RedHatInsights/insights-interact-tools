import art from 'ascii-art';
import { log } from './helpers.js';

export const asciiHeader = async () => {
  try {
    const rendered = await art.font('Insights Interact', 'Doom').completed();
    log.chalk('redBright', '\n' + rendered + '\n');
  } catch (err) {
    // err is an error
  }
};

export const commandNotImplemented =
  ({ input }) => {
    log.info('Sorry, "' + input.join(' ') + '" not implemented');
  };
