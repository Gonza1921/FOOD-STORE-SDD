#!/usr/bin/env node

/**
 * Engram Sync Tool
 * 
 * Workflow simplificado para sincronizar memoria compartida del equipo
 * 
 * Uso:
 *   engram-sync --export    → Exporta memoria local a .engram/vault.json
 *   engram-sync --import    → Importa .engram/vault.json a memoria local
 *   engram-sync --status    → Muestra estado de sincronización
 *   engram-sync --help      → Muestra esta ayuda
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Detectar si estamos en el repo
const projectRoot = process.cwd();
const engramDir = path.join(projectRoot, '.engram');
const vaultPath = path.join(engramDir, 'vault.json');

const args = process.argv.slice(2);
const command = args[0];

function log(msg, color = 'white') {
  const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function runCommand(cmd) {
  try {
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function exportVault() {
  log('\n📤 Exportando memoria local a .engram/vault.json...', 'blue');
  
  // Verificar que .engram existe
  if (!fs.existsSync(engramDir)) {
    log('❌ Error: carpeta .engram/ no encontrada', 'red');
    process.exit(1);
  }

  const result = runCommand('engram export');
  
  if (!result.success) {
    log(`❌ Error al exportar: ${result.error}`, 'red');
    process.exit(1);
  }

  // Guardar el JSON
  try {
    fs.writeFileSync(vaultPath, result.output, 'utf-8');
    log(`✅ Memoria exportada a: ${vaultPath}`, 'green');
    
    // Mostrar estadísticas
    const stats = runCommand('engram stats');
    if (stats.success) {
      console.log(stats.output);
    }
    
    log('\n📌 Próximos pasos:', 'yellow');
    log('  git add .engram/vault.json', 'white');
    log('  git commit -m "docs(memory): export team vault"', 'white');
    log('  git push', 'white');
  } catch (error) {
    log(`❌ Error escribiendo vault.json: ${error.message}`, 'red');
    process.exit(1);
  }
}

function importVault() {
  log('\n📥 Importando memoria desde .engram/vault.json...', 'blue');
  
  // Verificar que vault.json existe
  if (!fs.existsSync(vaultPath)) {
    log(`❌ Error: ${vaultPath} no encontrado`, 'red');
    log('   Asegúrate de ejecutar: git pull', 'yellow');
    process.exit(1);
  }

  const result = runCommand(`engram import ${vaultPath}`);
  
  if (!result.success) {
    log(`❌ Error al importar: ${result.error}`, 'red');
    process.exit(1);
  }

  log(`✅ Memoria importada desde: ${vaultPath}`, 'green');
  
  // Mostrar estadísticas
  const stats = runCommand('engram stats');
  if (stats.success) {
    console.log(stats.output);
  }
}

function statusSync() {
  log('\n📊 Estado de sincronización:', 'blue');
  
  if (!fs.existsSync(vaultPath)) {
    log('❌ .engram/vault.json no encontrado', 'red');
    process.exit(1);
  }

  const vaultSize = fs.statSync(vaultPath).size;
  const vaultSizeKB = (vaultSize / 1024).toFixed(2);
  
  log(`✅ Vault encontrado: ${vaultPath}`, 'green');
  log(`   Tamaño: ${vaultSizeKB} KB`, 'white');
  
  // Mostrar último commit que modificó vault.json
  const lastCommit = runCommand('git log -1 --format="%h - %s (%ar)" -- .engram/vault.json');
  if (lastCommit.success) {
    log(`   Último sync: ${lastCommit.output.trim()}`, 'white');
  }
  
  // Mostrar cambios pendientes
  const diff = runCommand('git diff .engram/vault.json');
  if (diff.success && diff.output.length > 0) {
    log('\n⚠️  Hay cambios sin commitear en vault.json', 'yellow');
    log('   Ejecuta: engram-sync --export && git add .engram/vault.json', 'white');
  } else {
    log('\n✅ Todo sincronizado', 'green');
  }
}

function showHelp() {
  console.log(`
╭─────────────────────────────────────────────────────────────╮
│           🧠 Engram Sync - Team Memory Tool                 │
╰─────────────────────────────────────────────────────────────╯

COMANDOS:

  engram-sync --export
    Exporta tu memoria local a .engram/vault.json
    Usa esto después de completar features/fixes importantes
    
  engram-sync --import
    Importa .engram/vault.json a tu memoria local
    Usa esto después de git pull para traer conocimiento del equipo
    
  engram-sync --status
    Muestra estado actual de sincronización
    Verifica si hay cambios pendientes de exportar
    
  engram-sync --help
    Muestra esta ayuda

╭─────────────────────────────────────────────────────────────╮
│  FLUJO DE TRABAJO TÍPICO                                    │
╰─────────────────────────────────────────────────────────────╯

1. Trabajas en una feature y completas tareas:
   
   mem_save "Título de lo aprendido"
   
2. Exportas tu conocimiento:
   
   engram-sync --export
   git add .engram/vault.json
   git commit -m "docs(memory): export team vault"
   git push
   
3. Tu equipo recibe los cambios:
   
   git pull
   engram-sync --import
   
4. Próxima sesión, el contexto ya está disponible:
   
   mem_search "tema anterior"  ✅ encuentra el conocimiento

╭─────────────────────────────────────────────────────────────╮
│  ARCHIVOS IMPORTANTES                                       │
╰─────────────────────────────────────────────────────────────╯

.engram/
├── vault.json          ← Memoria compartida (compartida en Git)
├── .gitignore          ← Ignora archivos temporales
└── README.md           ← Documentación

~/.engram/
├── engram.db           ← Base de datos local (NO compartida)
├── engram.db-shm
└── engram.db-wal

═══════════════════════════════════════════════════════════════
`);
}

// Main
switch (command) {
  case '--export':
    exportVault();
    break;
  case '--import':
    importVault();
    break;
  case '--status':
    statusSync();
    break;
  case '--help':
  case '-h':
  case undefined:
    showHelp();
    break;
  default:
    log(`❌ Comando desconocido: ${command}`, 'red');
    log('Usa: engram-sync --help', 'yellow');
    process.exit(1);
}
