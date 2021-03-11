import { constants as fsConstants, promises as fs } from 'fs';
import path from 'path';
import paths from './paths';

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

  return [...paths.php, ...symlinkPaths];
}
