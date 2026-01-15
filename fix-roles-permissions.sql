-- ====================================
-- FIX: Corregir tablas roles y permissions
-- Error: no existe la columna roles.isSystem
-- ====================================

-- PASO 1: AGREGAR COLUMNAS FALTANTES A ROLES
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN DEFAULT false;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "hierarchy" INTEGER DEFAULT 0;

-- PASO 2: RENOMBRAR COLUMNAS EN ROLES (camelCase → snake_case)
ALTER TABLE "roles" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "roles" RENAME COLUMN "updatedAt" TO "updated_at";

-- PASO 3: AJUSTAR PERMISSIONS (resource → module)
ALTER TABLE "permissions" RENAME COLUMN "resource" TO "module";

-- PASO 4: AGREGAR COLUMNAS FALTANTES A PERMISSIONS
ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN DEFAULT false;
ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;

-- PASO 5: RENOMBRAR COLUMNAS EN PERMISSIONS (camelCase → snake_case)
ALTER TABLE "permissions" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "permissions" RENAME COLUMN "updatedAt" TO "updated_at";

-- PASO 6: VERIFICAR ESTRUCTURAS
SELECT 'ROLES TABLE:' as info;
\d roles

SELECT 'PERMISSIONS TABLE:' as info;
\d permissions
