import { execFile } from 'node:child_process';
import log from 'fancy-log';

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
