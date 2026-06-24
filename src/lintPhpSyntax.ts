import log from 'fancy-log';
import colors from 'ansi-colors';
import { execFile, isExecFileException } from './execFile.js';

export function lintPhpSyntax(fileName: string) {
  return async function lint() {
    let stdout: string = '';

    try {
      ({ stdout } = await execFile('php', ['-l', fileName]));
    } catch (error) {
      if (isExecFileException(error)) {
        if (error.code !== 255) {
          log(`exec error: ${error.message}`);
          console.error(error.stderr);
          throw error;
        }

        // There were linting errors, capture those.
        stdout = error.stdout ?? '';
      }
    }

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
  };
}
