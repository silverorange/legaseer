import readline from 'readline';
import log from 'fancy-log';
import colors from 'ansi-colors';
import chokidar from 'chokidar';
import lockfile from 'proper-lockfile';
import { getPhpWatchPaths } from './getPhpWatchPaths.js';
import { queue } from './hashQueue.js';
import { composerDumpAutoload } from './composerDumpAutoload.js';
import { lintPhpSyntax } from './lintPhpSyntax.js';
import { setupSymlinks } from './setupSymlinks.js';
import { teardownSymlinks } from './teardownSymlinks.js';
import { compileLess, compileAllLess } from './compileLess.js';
import paths from './paths.js';

async function main() {
  let release: () => Promise<void>;
  try {
    release = await lockfile.lock('./');
  } catch (e) {
    if (e.code === 'ELOCKED') {
      console.error('Watcher is already running.');
    } else {
      console.error('Could not acquire lock file.');
      console.error(e);
    }
    process.exit(1);
  }

  const phpPaths = await getPhpWatchPaths();
  const lessFiles = new Set<string>();
  let ready = false;

  setupSymlinks();

  const watcher = chokidar
    .watch([...phpPaths, ...paths.less])
    .on('ready', () => {
      // For whatever reason on Linux, the ready event is called multiple times.
      // It's still called correctly after the initial add events.
      if (!ready) {
        queue('classmap', composerDumpAutoload);
        queue('compile', compileAllLess(lessFiles));
        log(colors.green('Ready and listening for file changes.'));
        ready = true;
      }
    })
    .on('all', (event, path) => {
      if (/\.php$/i.test(path) && ready) {
        queue('classmap', composerDumpAutoload);
        if (event === 'change') {
          queue(`lint${path}`, lintPhpSyntax(path));
        }
      }

      if (/\.less$/i.test(path)) {
        if (event === 'add') {
          lessFiles.add(path);
          if (ready) {
            queue(`compile${path}`, compileLess(path, lessFiles));
          }
        }

        if (event === 'unlink') {
          lessFiles.delete(path);
        }

        if (event === 'change' && ready) {
          queue(`compile${path}`, compileLess(path, lessFiles));
        }
      }
    });

  async function shutdown() {
    log(colors.green('Stopping file watcher.'));

    try {
      await watcher.close();
      teardownSymlinks();
      await composerDumpAutoload();
      await release();
    } catch (e) {
      log(colors.red('Error during shutdown:'), e);
      process.exit(1);
    }

    log(colors.green('BYE.'));
    process.exit(0);
  }

  process.on('SIGINT', () => {
    shutdown();
  });

  process.on('SIGTERM', () => {
    shutdown();
  });

  // Handling SIGINT when process is bootstrapped from Yarn does not work
  // correctly. See https://github.com/yarnpkg/yarn/issues/4667
  //
  // Instead we turn on raw keyboard handling mode and listen for Ctrl+C. We
  // still include a SIGINT handler in the event that another process wants
  // to terminate this process, but the user-interface will be less than optimal
  // in that case.
  readline.emitKeypressEvents(process.stdin);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on('keypress', (_, key) => {
    if (key.ctrl && key.name === 'c') {
      shutdown();
    }
  });
}

main();
