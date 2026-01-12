#!/usr/bin/env node

/**
 * @fileoverview Script helper para ejecutar migraciones de TypeORM
 * @module database/migrations
 *
 * Uso:
 *   npm run migration:run
 *   npm run migration:revert
 *   npm run migration:show
 */

require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');

// Comando base de TypeORM
const typeormPath = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'typeorm');
const dataSourcePath = path.join(__dirname, '..', 'config', 'database', 'data-source.ts');

// Función para ejecutar comandos
function runCommand(command, description) {
  console.log(`\n🚀 ${description}...\n`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
    if (stderr) {
      console.error(`⚠️  Warning: ${stderr}`);
    }
    console.log(stdout);
    console.log(`\n✅ ${description} completado\n`);
  });
}

// Obtener el comando del argumento
const action = process.argv[2];

switch (action) {
  case 'run':
    runCommand(
      `${typeormPath} migration:run -d ${dataSourcePath}`,
      'Ejecutando migraciones pendientes',
    );
    break;

  case 'revert':
    runCommand(
      `${typeormPath} migration:revert -d ${dataSourcePath}`,
      'Revirtiendo última migración',
    );
    break;

  case 'show':
    runCommand(
      `${typeormPath} migration:show -d ${dataSourcePath}`,
      'Mostrando estado de migraciones',
    );
    break;

  default:
    console.log(`
Uso: node run-migration.js [comando]

Comandos disponibles:
  run     - Ejecutar migraciones pendientes
  revert  - Revertir última migración
  show    - Mostrar estado de migraciones

Ejemplos:
  node run-migration.js run
  node run-migration.js show
    `);
    process.exit(1);
}
