# 🧠 Engram Team Memory Vault

Este directorio contiene la memoria compartida del equipo usando **Engram**, un sistema de persistencia que permite que múltiples agentes IA mantengan contexto entre sesiones.

## 📂 Estructura

```
.engram/
├── README.md       ← Este archivo
├── vault.json      ← Exportación de la memoria compartida
└── SETUP.md        ← Instrucciones de setup (próximamente)
```

## 🚀 Cómo usar

### Para nuevos miembros del equipo

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
   # Debe mostrar las memories del equipo
   ```

### Para compartir nuevas memories

Después de completar una tarea importante:

1. **Exporta tu memoria local**
   ```bash
   engram export > .engram/vault.json
   ```

2. **Commitea y pushea**
   ```bash
   git add .engram/vault.json
   git commit -m "docs(memory): export updated team engram vault"
   git push
   ```

3. **Comunica al equipo**
   - Avisa en Slack/Discord que se actualizó la memoria
   - Pide que todos hagan `git pull` y `engram import .engram/vault.json`

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

## 🔄 Flujo de trabajo

```
Agente implementa feature
    ↓
Guardar en memoria (mem_save, mem_session_summary)
    ↓
Exportar: engram export > .engram/vault.json
    ↓
Commit + Push
    ↓
Equipo: git pull + engram import
    ↓
Próximo agente tiene contexto de sesión anterior
```

## ⚙️ Comandos útiles

```bash
# Ver todas las memories
engram stats

# Buscar información específica
engram search "CH-012"

# Ver memoria detallada por ID
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
