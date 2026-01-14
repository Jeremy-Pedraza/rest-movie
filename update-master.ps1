# Script para actualizar MASTER.md con la sección Multi-Tenant
# Ubicación: C:\laragon\www\rest-valdez\

$rootPath = "C:\laragon\www\rest-valdez"
$masterPath = Join-Path $rootPath "docs\MASTER.md"
$sectionPath = Join-Path $rootPath "docs\MULTI-TENANT-MASTER-SECTION.md"
$backupPath = Join-Path $rootPath "docs\MASTER.md.backup"

Write-Host "🔄 Actualizando MASTER.md con sección Multi-Tenant..." -ForegroundColor Cyan

# 1. Crear backup
Write-Host "📦 Creando backup..." -ForegroundColor Yellow
Copy-Item $masterPath $backupPath -Force
Write-Host "✅ Backup creado en: $backupPath" -ForegroundColor Green

# 2. Leer archivos
Write-Host "📖 Leyendo archivos..." -ForegroundColor Yellow
$masterContent = Get-Content $masterPath -Raw -Encoding UTF8
$sectionContent = Get-Content $sectionPath -Raw -Encoding UTF8

# 3. Encontrar posición de inserción
$marker = "## 🔤 Nomenclatura Obligatoria"
$position = $masterContent.IndexOf($marker)

if ($position -eq -1) {
    Write-Host "❌ Error: No se encontró la sección 'Nomenclatura Obligatoria'" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Posición de inserción encontrada" -ForegroundColor Green

# 4. Insertar contenido
$before = $masterContent.Substring(0, $position)
$after = $masterContent.Substring($position)

# Remover el encabezado del archivo de sección (primera línea)
$sectionLines = $sectionContent -split "`r`n"
$sectionWithoutHeader = ($sectionLines | Select-Object -Skip 1) -join "`r`n"

$newContent = $before + $sectionWithoutHeader + "`r`n`r`n---`r`n`r`n" + $after

# 5. Actualizar fecha de última actualización
$newContent = $newContent -replace 'Última actualización:\*\* Enero 2025 - Sesión 13 \(TasksModule \+ Seeds\)', 'Última actualización:** Enero 2025 - Multi-Tenant System Implementado (Schema-per-Tenant)'

# 6. Actualizar tabla de contenidos
$newContent = $newContent -replace '4\. \[Componentes Globales Activos\]\(#-componentes-globales-activos\)', '4. [Componentes Globales Activos](#-componentes-globales-activos)'
$newContent = $newContent -replace '5\. \[Estructura de Módulos\]\(#-estructura-de-módulos\)', "5. [Sistema Multi-Tenant](#-sistema-multi-tenant-schema-per-tenant)`r`n6. [Estructura de Módulos](#-estructura-de-módulos)"
$newContent = $newContent -replace '6\. \[Nomenclatura Obligatoria\]', '7. [Nomenclatura Obligatoria]'
$newContent = $newContent -replace '7\. \[Patrones Obligatorios por Capa\]', '8. [Patrones Obligatorios por Capa]'
$newContent = $newContent -replace '8\. \[Formato de Respuestas\]', '9. [Formato de Respuestas]'
$newContent = $newContent -replace '9\. \[Sistema de Errores\]', '10. [Sistema de Errores]'
$newContent = $newContent -replace '10\. \[Anti-Patrones Prohibidos\]', '11. [Anti-Patrones Prohibidos]'
$newContent = $newContent -replace '11\. \[Checklist Pre-Commit\]', '12. [Checklist Pre-Commit]'

# 7. Guardar archivo actualizado
Write-Host "💾 Guardando archivo actualizado..." -ForegroundColor Yellow
Set-Content -Path $masterPath -Value $newContent -Encoding UTF8 -NoNewline

# 8. Estadísticas
$originalSize = (Get-Item $backupPath).Length
$newSize = (Get-Item $masterPath).Length
$difference = $newSize - $originalSize

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ MASTER.md actualizado exitosamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Estadísticas:" -ForegroundColor Yellow
Write-Host "   Tamaño original: $($originalSize / 1KB) KB" -ForegroundColor White
Write-Host "   Tamaño nuevo:    $($newSize / 1KB) KB" -ForegroundColor White
Write-Host "   Diferencia:      +$($difference / 1KB) KB" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Backup guardado en:" -ForegroundColor Yellow
Write-Host "   $backupPath" -ForegroundColor White
Write-Host ""
Write-Host "📋 Cambios realizados:" -ForegroundColor Yellow
Write-Host "   ✅ Sección Multi-Tenant insertada" -ForegroundColor Green
Write-Host "   ✅ Tabla de contenidos actualizada" -ForegroundColor Green
Write-Host "   ✅ Fecha de última actualización modificada" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 ¡Documentación actualizada completamente!" -ForegroundColor Green
