#!/usr/bin/env node

/**
 * @fileoverview Helper para ejecutar migraciones de TypeORM
 * @module database/migrations
 *
 * Uso:
 *   node src/database/run-migration.js run
 *   node src/database/run-migration.js run --prod
 *   node src/database/run-migration.js show --dev
 */

const { exec } = require('child_process');
const path = require('path');

const typeormBin = process.platform === 'win32' ? 'typeorm.cmd' : 'typeorm';
const typeormPath = path.join(__dirname, '..', '..', 'node_modules', '.bin', typeormBin);
const dataSourcePath = path.join(__dirname, '..', 'config', 'database', 'data-source.ts');

const [action, ...flags] = process.argv.slice(2);

function resolveEnvMode() {
  if (flags.includes('--prod')) return 'production';
  if (flags.includes('--dev')) return 'development';
  return process.env.NODE_ENV || 'development';
}

function runCommand(command, description, nodeEnv) {
  console.log(`\n[Migration] ${description}`);
  console.log(`[Migration] NODE_ENV=${nodeEnv}\n`);

  const cmd = process.platform === 'win32' ? `cmd /c ${command}` : command;

  exec(cmd, { env: { ...process.env, NODE_ENV: nodeEnv } }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Migration] Error: ${error.message}`);
      process.exit(1);
    }

    if (stderr) {
      console.error(`[Migration] Warning: ${stderr}`);
    }

    console.log(stdout);
    console.log(`[Migration] ${description} completado\n`);
  });
}

function printUsage() {
  console.log(`
Uso: node src/database/run-migration.js <comando> [--prod|--dev]

Comandos:
  run      Ejecutar migraciones pendientes
  revert   Revertir ultima migracion
  show     Mostrar estado de migraciones

Flags:
  --prod   Fuerza NODE_ENV=production
  --dev    Fuerza NODE_ENV=development

Ejemplos:
  node src/database/run-migration.js run
  node src/database/run-migration.js run --prod
  node src/database/run-migration.js show --dev
`);
}

const envMode = resolveEnvMode();

switch (action) {
  case 'run':
    runCommand(`${typeormPath} migration:run -d ${dataSourcePath}`, 'Ejecutando migraciones', envMode);
    break;

  case 'revert':
    runCommand(`${typeormPath} migration:revert -d ${dataSourcePath}`, 'Revirtiendo migracion', envMode);
    break;

  case 'show':
    runCommand(`${typeormPath} migration:show -d ${dataSourcePath}`, 'Mostrando estado de migraciones', envMode);
    break;

  default:
    printUsage();
    process.exit(1);
}
