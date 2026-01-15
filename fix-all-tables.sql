-- ====================================
-- FIX COMPLETO: Corregir TODAS las tablas
-- Errores: snake_case vs camelCase + columnas faltantes
-- ====================================

\echo '==== INICIO DEL FIX ===='

-- ============================================
-- PASO 1: TABLA ROLES
-- ============================================
\echo 'Fixing: roles table...'

-- Agregar columnas faltantes
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN DEFAULT false;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "hierarchy" INTEGER DEFAULT 0;

-- Renombrar columnas (solo si existen con el nombre viejo)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='createdAt') THEN
    ALTER TABLE "roles" RENAME COLUMN "createdAt" TO "created_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='updatedAt') THEN
    ALTER TABLE "roles" RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;
END $$;

-- ============================================
-- PASO 2: TABLA PERMISSIONS
-- ============================================
\echo 'Fixing: permissions table...'

-- Renombrar resource → module (si existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='permissions' AND column_name='resource') THEN
    ALTER TABLE "permissions" RENAME COLUMN "resource" TO "module";
  END IF;
END $$;

-- Agregar columnas faltantes
ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN DEFAULT false;
ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;

-- Renombrar columnas
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='permissions' AND column_name='createdAt') THEN
    ALTER TABLE "permissions" RENAME COLUMN "createdAt" TO "created_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='permissions' AND column_name='updatedAt') THEN
    ALTER TABLE "permissions" RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;
END $$;

-- ============================================
-- PASO 3: TABLA USERS  
-- ============================================
\echo 'Fixing: users table...'

DO $$ 
BEGIN
  -- Lista de columnas a renombrar
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='firstName') THEN
    ALTER TABLE "users" RENAME COLUMN "firstName" TO "first_name";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lastName') THEN
    ALTER TABLE "users" RENAME COLUMN "lastName" TO "last_name";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='emailVerified') THEN
    ALTER TABLE "users" RENAME COLUMN "emailVerified" TO "email_verified";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='emailVerifiedAt') THEN
    ALTER TABLE "users" RENAME COLUMN "emailVerifiedAt" TO "email_verified_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='emailVerificationToken') THEN
    ALTER TABLE "users" RENAME COLUMN "emailVerificationToken" TO "email_verification_token";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='failedLoginAttempts') THEN
    ALTER TABLE "users" RENAME COLUMN "failedLoginAttempts" TO "failed_login_attempts";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lockedUntil') THEN
    ALTER TABLE "users" RENAME COLUMN "lockedUntil" TO "locked_until";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lastLoginAt') THEN
    ALTER TABLE "users" RENAME COLUMN "lastLoginAt" TO "last_login_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lastLoginIp') THEN
    ALTER TABLE "users" RENAME COLUMN "lastLoginIp" TO "last_login_ip";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='passwordResetToken') THEN
    ALTER TABLE "users" RENAME COLUMN "passwordResetToken" TO "password_reset_token";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='passwordResetExpires') THEN
    ALTER TABLE "users" RENAME COLUMN "passwordResetExpires" TO "password_reset_expires";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='companyId') THEN
    ALTER TABLE "users" RENAME COLUMN "companyId" TO "company_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='createdAt') THEN
    ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updatedAt') THEN
    ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deletedAt') THEN
    ALTER TABLE "users" RENAME COLUMN "deletedAt" TO "deleted_at";
  END IF;
END $$;

\echo '==== FIX COMPLETADO ===='
\echo ''
\echo 'Verificando estructuras...'
\echo ''

-- Verificar roles
\echo '=== ROLES TABLE ==='
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roles' 
ORDER BY ordinal_position;

-- Verificar permissions
\echo ''
\echo '=== PERMISSIONS TABLE ==='
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'permissions' 
ORDER BY ordinal_position;

-- Verificar users (solo algunas columnas importantes)
\echo ''
\echo '=== USERS TABLE (primeras 10 columnas) ==='
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position
LIMIT 10;
