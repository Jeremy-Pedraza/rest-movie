-- Fix: Renombrar errorCode → error_code en tabla logs

ALTER TABLE logs RENAME COLUMN "errorCode" TO "error_code";

-- Verificar
\d logs
