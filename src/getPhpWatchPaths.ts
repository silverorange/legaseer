import { constants as fsConstants, promises as fs } from 'fs';
import globby from 'globby';
import path from 'path';
import paths from './paths';

const wwwPath = 'www/*.php';

async function getExistingPaths(pathsToTest: string[]) {
  const exists = await Promise.all(
    pathsToTest.map(async (pathToTest) => {
      try {
        // eslint-disable-next-line no-bitwise
        await fs.access(pathToTest, fsConstants.R_OK | fsConstants.X_OK);
        return true;
      } catch (e) {
        return false;
      }
    })
  );

  return pathsToTest.filter((_, index) => exists[index]);
}

async function getSymlinkPaths(pathsToTest: string[]) {
  const stats = await Promise.all(
    pathsToTest.map((pathToTest) => {
      return fs.lstat(pathToTest);
    })
  );
  return pathsToTest.filter((_, index) => stats[index].isSymbolicLink());
}

/**
 * Gets resolved PHP files within the www directory
 *
 * Chokidar has trouble with circular symlinks as found in some of our project
 * `www` directories so we resolve the glob to an explicit list of file names.
 *
 * We won't see new files this way, but at least Chokidar will run without
 * complaining.
 */
async function getWwwPaths(wwwPaths: string[]) {
  return globby(wwwPaths, { expandDirectories: false });
}

/**
 * Chokidar can't glob symlink directories properly so explicitly list
 * each directory instead.
 */
export async function getPhpWatchPaths() {
  const vendorPaths = await getExistingPaths(paths.vendors);
  const symlinkPaths = (
    await Promise.all(
      vendorPaths.map(async (vendorPath) =>
        getSymlinkPaths(
          (await fs.readdir(vendorPath)).map((dir) =>
            path.join(vendorPath, dir)
          )
        )
      )
    )
  ).flat();

  const wwwPaths = await getWwwPaths(
    paths.php.filter((testPath) => testPath === wwwPath)
  );

  return [
    ...paths.php.filter((testPath) => testPath !== wwwPath),
    ...wwwPaths,
    ...symlinkPaths,
  ];
}
