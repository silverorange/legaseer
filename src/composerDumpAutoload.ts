import log from 'fancy-log';
import { execFile, isExecFileException } from './execFile.js';

export async function composerDumpAutoload() {
  try {
    await execFile('composer', ['-q', 'dump-autoload']);
    log('Rebuilt PHP autoloader map.');
  } catch (error) {
    if (isExecFileException(error)) {
      log(`exec error: ${error.message}`);
    }
    throw error;
  }
}
