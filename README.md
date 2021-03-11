# Legaseer

Watches PHP and LESS files and performs actions for legacy silverorange
PHP projects.

- Runs `lessc` on changed or added LESS files. Dependant files are also recompiled.
- Runs `php -l` on changed or added PHP files.
- Runs `composer dump-autoload` when any PHP files are changed, added, or deleted.
- Optionally symlinks PHP development packages

## Adding to Projects

1. `yarn add --dev @silverorange/legaseer`
2. add a NPM script to `package.json`:

```
"start": "legaseer"
```

3. `yarn start --symlinks=package1,package2`
