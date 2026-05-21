# 🧠 Engram Team Memory Vault

Este directorio contiene la memoria compartida del equipo usando **Engram**, un sistema de persistencia que permite que múltiples agentes IA mantengan contexto entre sesiones.

## 📂 Estructura

```
.engram/
├── README.md              ← Este archivo
├── vault.json             ← Exportación de la memoria compartida (VERSIONADA EN GIT)
├── .gitignore             ← Ignora archivos temporales
├── engram-sync.cjs        ← Script Node.js para sincronización (CommonJS)
├── engram-sync.bat        ← Wrapper Windows
└── engram-sync.sh         ← Wrapper Linux/Mac
```

## 🚀 Cómo usar

### ⚡ OPCIÓN 1: Uso rápido con npm scripts (RECOMENDADO)

**Para nuevos miembros:**
```bash
npm run engram:import    # Importa memoria del equipo
npm run engram:status    # Verifica estado
```

**Para compartir tu trabajo:**
```bash
npm run engram:export    # Exporta tu memoria local
git add .engram/vault.json
git commit -m "docs(memory): export team vault"
git push
```

### 🔧 OPCIÓN 2: Uso directo con engram-sync

**Para nuevos miembros:**
```bash
node .engram/engram-sync.cjs --import
node .engram/engram-sync.cjs --status
```

**Para compartir tu trabajo:**
```bash
node .engram/engram-sync.cjs --export
git add .engram/vault.json
git commit -m "docs(memory): export team vault"
git push
```

### 📦 OPCIÓN 3: Uso manual tradicional

1. **Clonar el repo**
   ```bash
   git clone <repo-url>
   cd FOOD-STORE-SDD
   ```

2. **Importar la memoria compartida**
   ```bash
   engram import .engram/vault.json
   ```

3. **Verificar que se importó correctamente**
   ```bash
   engram stats
   ```

## 📊 Contenido actual

```
Total memories:  2
Episodic:        2
Semantic:        0
Procedural:      0
Entities:        6
```

### Memories activas
- ✅ CH-012 Panel de Administración (Dashboard, KPIs, CRUD usuarios)
- ✅ Migración npm → pnpm completada

## 🔄 Flujo de trabajo simplificado

```
1. Trabajas y completas tasks
   ↓
2. Guardas en memoria:  mem_save "Lo que aprendiste"
   ↓
3. Exportas tu trabajo:  npm run engram:export
   ↓
4. Commiteas:          git add .engram/vault.json && git commit -m "..."
   ↓
5. Pusheas:            git push
   ↓
6. Equipo recibe:      git pull && npm run engram:import
   ↓
7. ¡Contexto compartido! Próxima sesión tiene el conocimiento
```

## ⚙️ Comandos disponibles

### Con npm (recomendado)

```bash
npm run engram:export    # 📤 Exporta memoria local a vault.json
npm run engram:import    # 📥 Importa vault.json a memoria local
npm run engram:status    # 📊 Muestra estado de sincronización
npm run engram:help      # ❓ Muestra ayuda
```

### Con node directo

```bash
node .engram/engram-sync.cjs --export    # 📤 Exporta
node .engram/engram-sync.cjs --import    # 📥 Importa
node .engram/engram-sync.cjs --status    # 📊 Estado
node .engram/engram-sync.cjs --help      # ❓ Ayuda
```

### Comandos engram nativos

```bash
# Ver todas las memories
engram stats

# Buscar información específica
engram search "CH-012"

# Ver memoria detallada por tema
engram recall "admin dashboard"

# Health check
engram eval

# Listar entidades conocidas
engram entities
```

## 📝 Notas

- La memoria se sincroniza **manualmente** vía Git
- Cada commit en `vault.json` es un snapshot de lo aprendido
- Es seguro hacer merge de `vault.json` (append-only, no conflictos)
- La memoria es **compartida entre todos** — respeta la privacidad del equipo

## 🔐 Privacidad

- No guardes secrets en la memoria (use .env, GitHub Secrets)
- No guardes información sensible de clientes
- La memoria es legible por cualquiera con acceso al repo

---

**Última actualización**: 21 de Mayo de 2026  
**Vault version**: 1.0  
**Maintained by**: Orquestador OPSX
