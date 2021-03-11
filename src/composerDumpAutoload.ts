import log from 'fancy-log';
import { execFile } from 'child_process';

export function composerDumpAutoload() {
  return new Promise<void>((resolve, reject) => {
    execFile('composer', ['-q', 'dump-autoload'], (error) => {
      if (error !== null) {
        log(`exec error: ${error}`);
        reject(error);
      } else {
        log('Rebuilt PHP autoloader map.');
        resolve();
      }
    });
  });
}
