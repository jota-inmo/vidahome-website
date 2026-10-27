# Git Hook: Actualización Automática de CHANGELOG

## ✅ Hook Configurado

Se ha instalado un **git hook pre-commit** que actualiza automáticamente el CHANGELOG.md antes de cada commit.

## 🔧 Ubicación

`.git/hooks/pre-commit`

## ⚙️ Funcionamiento

1. Antes de completar cada commit, el hook ejecuta `npm run changelog:auto`
2. Si CHANGELOG.md cambia, se añade automáticamente al commit actual
3. Si no hay cambios (duplicado detectado), continúa normalmente

## 📝 Ventajas

- **Automático**: No necesitas ejecutar manualmente `npm run changelog:auto`
- **Integrado**: Los cambios del changelog se incluyen en el mismo commit
- **Sin duplicados**: El script detecta si ya existe una entrada para ese commit
- **Sin intervención**: Todo sucede automáticamente en cada commit

## 🧪 Prueba

Este archivo fue creado para probar el funcionamiento del hook. Si ves una entrada nueva en CHANGELOG.md después de hacer commit de este archivo, ¡el hook funciona correctamente!

## 🔄 Desactivar Temporalmente

Si necesitas desactivar el hook temporalmente:

```bash
# Opción 1: Renombrar el hook
mv .git/hooks/pre-commit .git/hooks/pre-commit.disabled

# Opción 2: Usar --no-verify al hacer commit
git commit --no-verify -m "mensaje"
```

## 📌 Notas

- El hook solo funciona en tu máquina local
- Otros colaboradores necesitan copiar el archivo `.git/hooks/pre-commit` manualmente
- Los hooks no se sincronizan automáticamente con git push/pull
