# 🔐 Guía Rápida - Crear archivo .env

> **⚠️ CRÍTICO:** Debes hacer esto antes del Paso 3

---

## 📋 Paso a Paso

### 1. Copiar template
```bash
# En la raíz del proyecto (C:\laragon\www\rest-valdez)
cp .env.example .env
```

O manualmente:
- Copiar `.env.example`
- Renombrar la copia a `.env`

---

### 2. Generar 3 secrets seguros

Necesitas generar 3 secrets diferentes (mínimo 32 caracteres cada uno):

#### Opción A - Con Node.js (Recomendado)
```bash
# En terminal/PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ejecuta este comando **3 veces** para obtener 3 secrets diferentes.

#### Opción B - Con OpenSSL
```bash
openssl rand -hex 32
```

Ejecuta este comando **3 veces**.

#### Opción C - Online (Solo desarrollo/testing)
https://generate-secret.vercel.app/32

---

### 3. Actualizar .env

Abre el archivo `.env` y reemplaza SOLO estas líneas:

```bash
# ============================================
# JWT AUTHENTICATION
# ============================================
# Access Token (autenticación)
JWT_SECRET=PEGA_AQUI_TU_SECRET_1_DE_64_CARACTERES
JWT_EXPIRES_IN=15m
JWT_ISSUER=mokka-api
JWT_AUDIENCE=mokka-client

# Refresh Token (renovación de sesión)
JWT_REFRESH_SECRET=PEGA_AQUI_TU_SECRET_2_DE_64_CARACTERES
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_LONG_EXPIRES_IN=30d

# Reset Token (recuperación de contraseña)
JWT_RESET_SECRET=PEGA_AQUI_TU_SECRET_3_DE_64_CARACTERES
JWT_RESET_EXPIRES_IN=1h
```

**Ejemplo de secrets válidos:**
```bash
JWT_SECRET=a1f3e8c9d2b4567890abcdef1234567890abcdef1234567890abcdef12345678
JWT_REFRESH_SECRET=b2g4f9d0e3c5678901bcdefg2345678901bcdefg2345678901bcdefg23456789
JWT_RESET_SECRET=c3h5g0e1f4d6789012cdefgh3456789012cdefgh3456789012cdefgh34567890
```

---

### 4. Verificar .gitignore

Asegúrate de que `.env` NO se subirá al repositorio:

```bash
# En .gitignore debe estar:
.env
.env.local
.env.*.local
```

✅ Si ya existe `.gitignore` con estas líneas, está bien.

---

## ⚠️ Seguridad

### ✅ Hacer
- ✅ Usar secrets diferentes para cada ambiente (dev, staging, prod)
- ✅ Generar nuevos secrets si crees que fueron comprometidos
- ✅ Mantener `.env` en `.gitignore`
- ✅ Usar secrets de mínimo 32 caracteres (64 recomendado)

### ❌ NO Hacer
- ❌ Compartir secrets por email/slack/whatsapp
- ❌ Usar los mismos secrets en todos los ambientes
- ❌ Commitear `.env` al repositorio
- ❌ Usar secrets cortos o predecibles

---

## 🔍 Verificación

Después de crear `.env`, verifica:

```bash
# Debe listar .env
dir .env

# .env NO debe estar en git
git status
# No debe aparecer ".env" en "Changes not staged"
```

---

## ✅ Listo para continuar

Una vez que tengas `.env` creado con secrets seguros:

✅ **Paso 2 completado**  
✅ **Archivo .env creado**  
🚀 **Listo para Paso 3** (Migración de sessions)

---

> **Tiempo estimado:** 2-3 minutos  
> **Dificultad:** Fácil
