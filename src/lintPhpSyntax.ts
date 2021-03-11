import log from 'fancy-log';
import colors from 'ansi-colors';
import { execFile } from 'child_process';

export function lintPhpSyntax(fileName: string) {
  return async function lint() {
    return new Promise<void>((resolve, reject) => {
      execFile('php', ['-l', fileName], (error, stdout, stderr) => {
        if (error !== null && error.code !== 255) {
          log(`exec error: ${error}`);
          console.error(stderr);
          reject(error);
        } else {
          // remove whitespace
          let contents = stdout.replace(/(^\s+|\s+$)/g, '');

          // exclude valid files from output
          if (!/^No syntax errors detected in .*\.php/.test(contents)) {
            // remove stdin filename
            contents = contents.replace(/in .*\.php on line/, 'on line');

            // remove unnecessary line
            contents = contents.replace(/\s+Errors parsing .*\.php$/g, '');

            log(colors.red('[PHP]'), fileName, '->', contents);
          }

          resolve();
        }
      });
    });
  };
}
