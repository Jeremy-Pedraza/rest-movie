# 📦 Cache Module - Documentación

> **Cache inteligente con tags, invalidación automática y estadísticas**
> 
> Módulo global de cache construido sobre RedisService que provee cache de datos de negocio con invalidación inteligente por tags, estadísticas de uso y endpoints de monitoreo.

---

## 📋 Tabla de Contenidos

1. [Características](#-características)
2. [Instalación](#-instalación)
3. [Uso Básico](#-uso-básico)
4. [API del CacheService](#-api-del-cacheservice)
5. [Endpoints del Controller](#-endpoints-del-controller)
6. [Configuración de TTL](#-configuración-de-ttl)
7. [Tags e Invalidación](#-tags-e-invalidación)
8. [Estadísticas](#-estadísticas)
9. [Best Practices](#-best-practices)
10. [Ejemplos Avanzados](#-ejemplos-avanzados)
11. [Troubleshooting](#-troubleshooting)

---

## ✨ Características

- ✅ **Cache con callback** - Método `remember()` obtiene del cache o ejecuta callback
- ✅ **Invalidación por tags** - Agrupa caches relacionados e invalida masivamente
- ✅ **Serialización automática** - No necesitas `JSON.stringify/parse`
- ✅ **Estadísticas de uso** - Hits, misses, hit ratio por tag
- ✅ **Cache warmup** - Precalentar datos críticos al inicio
- ✅ **TTL configurable** - Por tipo de dato (users, stats, sessions, etc.)
- ✅ **Endpoints de monitoreo** - 11 endpoints REST para debugging
- ✅ **TypeScript completo** - Tipos seguros en toda la API
- ✅ **@Global module** - Disponible en todos los módulos sin imports

---

## 🚀 Instalación

El módulo ya está instalado y configurado en el proyecto:

```typescript
// src/app.module.ts
import { CacheModule as CustomCacheModule } from '@modules/cache';

@Module({
  imports: [
    // ... otros módulos
    CustomCacheModule, // ✅ @Global - disponible en toda la app
  ],
})
export class AppModule {}
```

---

## 💡 Uso Básico

### 1. Inyectar CacheService en tu Service

```typescript
// src/modules/user/user.service.ts
import { CacheService } from '@modules/cache';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cacheService: CacheService, // ✅ Inyectar
  ) {}
}
```

### 2. Usar `remember()` para cache automático

```typescript
async findById(id: string): Promise<IUserResponse> {
  return await this.cacheService.remember(
    `user:${id}`,                               // Key
    async () => {                               // Callback si no existe
      const user = await this.userRepository.findById(id);
      if (!user) {
        this.handleError.notFound('Usuario', id);
      }
      return this.toUserResponse(user);
    },
    {
      ttl: 3600,                                // 1 hora
      tags: ['users', `user:${id}`],           // Tags para invalidación
    },
  );
}
```

**¿Cómo funciona?**
- 🔵 **Primera llamada**: Ejecuta callback → cachea resultado → retorna
- 🟢 **Siguientes llamadas**: Obtiene del cache → retorna (mucho más rápido)
- 🔴 **Al actualizar**: Invalidas tag → próxima llamada ejecuta callback

### 3. Invalidar cache al modificar datos

```typescript
async update(id: string, dto: UpdateUserDto): Promise<IUserResponse> {
  const user = await this.userRepository.update(id, dto);
  
  // Invalidar cache del usuario + stats
  await this.cacheService.invalidateTags([`user:${id}`, 'users', 'user-stats']);
  
  return this.toUserResponse(user);
}
```

---

## 🔧 API del CacheService

### Métodos Principales

#### `remember<T>(key, callback, options?)`
Obtiene del cache o ejecuta callback y cachea el resultado.

```typescript
const user = await this.cacheService.remember(
  'user:123',
  async () => this.repository.findById('123'),
  { ttl: 3600, tags: ['users', 'user:123'] }
);
```

**Opciones:**
```typescript
interface ICacheOptions {
  ttl?: number;           // Time to live en segundos (default: 3600)
  tags?: string[];        // Tags para invalidación
  skipNull?: boolean;     // No cachear null/undefined (default: false)
  refresh?: boolean;      // Forzar actualización (default: false)
}
```

#### `set<T>(key, value, ttl?, tags?)`
Guarda en cache manualmente.

```typescript
await this.cacheService.set('user:123', user, 3600, ['users']);
```

#### `get<T>(key)`
Obtiene del cache.

```typescript
const user = await this.cacheService.get<IUser>('user:123');
// null si no existe
```

#### `has(key)`
Verifica si existe.

```typescript
const exists = await this.cacheService.has('user:123');
```

#### `forget(key)`
Elimina una key específica.

```typescript
await this.cacheService.forget('user:123');
```

### Invalidación

#### `invalidateTag(tag)`
Invalida todas las keys con un tag.

```typescript
await this.cacheService.invalidateTag('users');
// Invalida: user:123, user:456, user:stats, etc.
```

#### `invalidateTags(tags[])`
Invalida múltiples tags.

```typescript
await this.cacheService.invalidateTags(['users', 'user-stats']);
```

#### `invalidatePattern(pattern)`
Invalida por patrón.

```typescript
await this.cacheService.invalidatePattern('user:*');
```

#### `flush()`
Limpia TODO el cache. ⚠️ **¡Peligroso!**

```typescript
await this.cacheService.flush();
```

#### `flushModule(module)`
Limpia cache de un módulo específico.

```typescript
await this.cacheService.flushModule('user');
```

### Estadísticas

#### `getStats()`
Obtiene estadísticas de uso.

```typescript
const stats = await this.cacheService.getStats();
// {
//   hits: 1500,
//   misses: 300,
//   hitRatio: 0.83,
//   totalKeys: 250,
//   byTag: {
//     'users': { hits: 800, misses: 100, keys: 50 }
//   }
// }
```

#### `resetStats()`
Resetea contadores.

```typescript
await this.cacheService.resetStats();
```

### Cache Warmup

#### `warmup<T>(key, callback, options?)`
Precalienta cache con datos críticos.

```typescript
async onModuleInit() {
  // Precargar roles al iniciar
  await this.cacheService.warmup('system:roles', async () => {
    return await this.roleRepository.findAll();
  }, { ttl: 86400 });
}
```

#### `warmupBatch(items[])`
Warmup masivo.

```typescript
await this.cacheService.warmupBatch([
  {
    key: 'system:roles',
    callback: async () => this.roleRepo.findAll(),
    options: { ttl: 86400 },
  },
  {
    key: 'system:permissions',
    callback: async () => this.permissionRepo.findAll(),
    options: { ttl: 86400 },
  },
]);
```

### Helpers

#### `getTTL(type)`
Obtiene TTL configurado por tipo.

```typescript
const ttl = this.cacheService.getTTL('users'); // 3600
```

#### `makeKey(module, ...parts)`
Genera key con prefijo.

```typescript
const key = this.cacheService.makeKey('user', '123', 'profile');
// 'user:123:profile'
```

#### `countKeys(pattern?)`
Cuenta keys por patrón.

```typescript
const count = await this.cacheService.countKeys('user:*');
```

#### `listKeys(pattern?, limit?)`
Lista keys.

```typescript
const keys = await this.cacheService.listKeys('user:*', 10);
```

#### `info()`
Información general del cache.

```typescript
const info = await this.cacheService.info();
```

---

## 🌐 Endpoints del Controller

Todos los endpoints están en `/api/v1/cache` y requieren autenticación.

### Monitoreo (Admin, Manager)

#### `GET /cache/stats`
Estadísticas de cache.

```bash
curl -X GET http://localhost:3000/api/v1/cache/stats \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "success": true,
  "message": "Estadísticas de cache obtenidas",
  "data": {
    "hits": 1500,
    "misses": 300,
    "hitRatio": 0.83,
    "totalKeys": 250,
    "memoryUsage": "12.5 MB",
    "byTag": {
      "users": { "hits": 800, "misses": 100, "keys": 50, "hitRatio": 0.88 }
    },
    "lastUpdated": "2025-01-12T15:30:00.000Z"
  }
}
```

#### `GET /cache/info`
Información general.

```bash
curl -X GET http://localhost:3000/api/v1/cache/info \
  -H "Authorization: Bearer {token}"
```

### Invalidación (Solo Admin)

#### `POST /cache/invalidate/tag/:tag`
Invalida un tag.

```bash
curl -X POST http://localhost:3000/api/v1/cache/invalidate/tag/users \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "success": true,
  "message": "Tag 'users' invalidado: 50 keys eliminadas",
  "data": { "keysInvalidated": 50 }
}
```

#### `POST /cache/invalidate/tags`
Invalida múltiples tags.

```bash
curl -X POST http://localhost:3000/api/v1/cache/invalidate/tags \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["users", "user-stats"]}'
```

#### `POST /cache/invalidate/pattern`
Invalida por patrón.

```bash
curl -X POST http://localhost:3000/api/v1/cache/invalidate/pattern \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "user:*"}'
```

### Limpieza (Solo Admin)

#### `DELETE /cache/flush`
⚠️ Limpia TODO el cache.

```bash
curl -X DELETE http://localhost:3000/api/v1/cache/flush \
  -H "Authorization: Bearer {token}"
```

#### `DELETE /cache/flush/:module`
Limpia módulo específico.

```bash
curl -X DELETE http://localhost:3000/api/v1/cache/flush/user \
  -H "Authorization: Bearer {token}"
```

### Consultas (Solo Admin)

#### `GET /cache/keys?pattern=*&limit=100`
Lista keys.

```bash
curl -X GET "http://localhost:3000/api/v1/cache/keys?pattern=user:*&limit=10" \
  -H "Authorization: Bearer {token}"
```

#### `GET /cache/tags/:tag/keys`
Keys de un tag.

```bash
curl -X GET http://localhost:3000/api/v1/cache/tags/users/keys \
  -H "Authorization: Bearer {token}"
```

#### `GET /cache/count?pattern=*`
Cuenta keys.

```bash
curl -X GET "http://localhost:3000/api/v1/cache/count?pattern=user:*" \
  -H "Authorization: Bearer {token}"
```

### Utilidades (Solo Admin)

#### `POST /cache/stats/reset`
Resetea estadísticas.

```bash
curl -X POST http://localhost:3000/api/v1/cache/stats/reset \
  -H "Authorization: Bearer {token}"
```

---

## ⚙️ Configuración de TTL

El CacheService tiene TTL predefinidos por tipo de dato:

```typescript
ttlByType: {
  users: 3600,       // 1 hora
  sessions: 1800,    // 30 minutos
  roles: 86400,      // 24 horas
  permissions: 86400, // 24 horas
  stats: 300,        // 5 minutos
  lists: 600,        // 10 minutos
  detail: 1800,      // 30 minutos
}
```

**Uso:**

```typescript
const ttl = this.cacheService.getTTL('users'); // 3600
```

---

## 🏷️ Tags e Invalidación

### ¿Qué son los tags?

Los tags agrupan caches relacionados para invalidación masiva.

**Ejemplo:**

```typescript
// Usuario ID 123
await this.cacheService.set('user:123', user, 3600, ['users', 'user:123']);
await this.cacheService.set('user:123:profile', profile, 3600, ['users', 'user:123']);
await this.cacheService.set('user:123:settings', settings, 3600, ['users', 'user:123']);
```

Al actualizar el usuario:

```typescript
await this.cacheService.invalidateTag('user:123');
// Invalida: user:123, user:123:profile, user:123:settings
```

### Estrategias de Tags

#### 1. Tag por entidad
```typescript
tags: ['users', 'user:123']
```

#### 2. Tag por módulo
```typescript
tags: ['products', 'product:456']
```

#### 3. Tag por tipo
```typescript
tags: ['stats', 'user-stats']
tags: ['lists', 'user-list']
```

#### 4. Tags jerárquicos
```typescript
tags: ['users', 'user:123', 'user:123:profile']
```

---

## 📊 Estadísticas

### Ver estadísticas en código

```typescript
const stats = await this.cacheService.getStats();

console.log(`Hit ratio: ${stats.hitRatio}`);
console.log(`Total keys: ${stats.totalKeys}`);
console.log(`Memory: ${stats.memoryUsage}`);

// Por tag
if (stats.byTag['users']) {
  console.log(`Users - Hits: ${stats.byTag['users'].hits}`);
  console.log(`Users - Misses: ${stats.byTag['users'].misses}`);
}
```

### Ver estadísticas via API

```bash
GET /api/v1/cache/stats
```

---

## 💎 Best Practices

### ✅ DO - Buenas prácticas

1. **Usa `remember()` siempre que puedas**
   ```typescript
   // ✅ BIEN
   return await this.cacheService.remember(
     'user:123',
     async () => this.repository.findById('123'),
     { ttl: 3600, tags: ['users', 'user:123'] }
   );
   ```

2. **Agrega tags para invalidación**
   ```typescript
   // ✅ BIEN - Con tags
   { ttl: 3600, tags: ['users', 'user:123'] }
   
   // ❌ MAL - Sin tags, no puedes invalidar grupos
   { ttl: 3600 }
   ```

3. **Invalida cache al modificar datos**
   ```typescript
   // ✅ BIEN
   async update(id: string, dto: UpdateUserDto) {
     const user = await this.repository.update(id, dto);
     await this.cacheService.invalidateTags([`user:${id}`, 'users', 'user-stats']);
     return user;
   }
   ```

4. **TTL según frecuencia de cambio**
   ```typescript
   // Datos estáticos (roles, permisos)
   { ttl: 86400 }  // 24 horas
   
   // Datos dinámicos (usuarios)
   { ttl: 3600 }   // 1 hora
   
   // Stats
   { ttl: 300 }    // 5 minutos
   ```

5. **Keys descriptivas**
   ```typescript
   // ✅ BIEN
   'user:123'
   'user:123:profile'
   'product:456:reviews'
   
   // ❌ MAL
   'u123'
   'data'
   ```

### ❌ DON'T - Evitar

1. **No cachear datos sensibles sin cifrar**
   ```typescript
   // ❌ MAL - Password en cache
   await this.cacheService.set('user:123:password', password);
   ```

2. **No usar TTL muy largos para datos dinámicos**
   ```typescript
   // ❌ MAL - Stats cacheadas 24h
   { ttl: 86400 }
   
   // ✅ BIEN - Stats cacheadas 5 min
   { ttl: 300 }
   ```

3. **No olvidar invalidar cache**
   ```typescript
   // ❌ MAL - Actualiza pero no invalida
   async update(id: string, dto: UpdateUserDto) {
     return await this.repository.update(id, dto);
   }
   
   // ✅ BIEN - Actualiza e invalida
   async update(id: string, dto: UpdateUserDto) {
     const user = await this.repository.update(id, dto);
     await this.cacheService.invalidateTags([`user:${id}`]);
     return user;
   }
   ```

4. **No cachear errores**
   ```typescript
   // ❌ MAL - Cachea incluso si lanza error
   return await this.cacheService.remember('key', async () => {
     throw new Error('Boom'); // Se cachea el error
   });
   
   // ✅ BIEN - remember() solo cachea resultados exitosos
   ```

---

## 🚀 Ejemplos Avanzados

### Ejemplo 1: Lista paginada con cache

```typescript
async findAll(query: QueryUserDto): Promise<IPaginatedResponse<IUserResponse>> {
  // Cache por query (serializado)
  const cacheKey = `users:list:${JSON.stringify(query)}`;
  
  return await this.cacheService.remember(
    cacheKey,
    async () => {
      const result = await this.userRepository.findAll(query);
      return {
        data: result.data.map(u => this.toResponse(u)),
        meta: result.meta,
      };
    },
    {
      ttl: 600,                    // 10 minutos
      tags: ['users', 'user-lists'],
    },
  );
}
```

### Ejemplo 2: Cache warmup al inicio

```typescript
// En AppModule o en un service específico
export class AppModule implements OnModuleInit {
  constructor(private readonly cacheService: CacheService) {}

  async onModuleInit() {
    await this.warmupCriticalData();
  }

  private async warmupCriticalData() {
    await this.cacheService.warmupBatch([
      {
        key: 'system:roles',
        callback: async () => this.roleRepo.findAll(),
        options: { ttl: 86400, tags: ['system', 'roles'] },
      },
      {
        key: 'system:permissions',
        callback: async () => this.permissionRepo.findAll(),
        options: { ttl: 86400, tags: ['system', 'permissions'] },
      },
      {
        key: 'system:config',
        callback: async () => this.configService.getAll(),
        options: { ttl: 3600, tags: ['system', 'config'] },
      },
    ]);
    
    console.log('✅ Cache warmed up');
  }
}
```

### Ejemplo 3: Cache condicional

```typescript
async findById(id: string, useCache: boolean = true): Promise<IUserResponse> {
  if (!useCache) {
    // Bypass cache
    const user = await this.userRepository.findById(id);
    if (!user) this.handleError.notFound('Usuario', id);
    return this.toUserResponse(user);
  }

  // Con cache
  return await this.cacheService.remember(
    `user:${id}`,
    async () => {
      const user = await this.userRepository.findById(id);
      if (!user) this.handleError.notFound('Usuario', id);
      return this.toUserResponse(user);
    },
    { ttl: 3600, tags: ['users', `user:${id}`] },
  );
}
```

### Ejemplo 4: Invalidación en cascada

```typescript
async deleteAccount(userId: string): Promise<void> {
  // Eliminar usuario
  await this.userRepository.softDelete(userId);
  
  // Invalidar en cascada
  await this.cacheService.invalidateTags([
    `user:${userId}`,           // Cache del usuario
    'users',                     // Listas de usuarios
    'user-stats',                // Estadísticas
    'user-lists',                // Listas paginadas
  ]);
  
  // También invalidar sesiones relacionadas
  await this.sessionService.revokeAllByUser(userId);
}
```

---

## 🔍 Troubleshooting

### El cache no se invalida

**Problema:** Actualizas datos pero el cache sigue devolviendo datos viejos.

**Solución:**
```typescript
// Verifica que estés invalidando los tags correctos
await this.cacheService.invalidateTags(['users', `user:${id}`]);

// Verifica que los tags coincidan con los usados en remember()
{ tags: ['users', `user:${id}`] }
```

### Hit ratio muy bajo

**Problema:** `hitRatio < 0.5` indica que la mayoría son misses.

**Causas posibles:**
1. TTL muy corto
2. Cache se invalida muy frecuentemente
3. Keys dinámicas (ej: timestamp en la key)

**Solución:**
```typescript
// Ver estadísticas por tag
const stats = await this.cacheService.getStats();
console.log(stats.byTag);

// Aumentar TTL si es apropiado
{ ttl: 3600 } // en vez de 300
```

### Memoria de Redis creciendo

**Problema:** Redis usa mucha memoria.

**Solución:**
```typescript
// Ver memoria usada
GET /api/v1/cache/stats

// Limpiar cache de módulo específico
DELETE /api/v1/cache/flush/user

// Reducir TTL
{ ttl: 600 } // en vez de 3600
```

### Cache no funciona

**Problema:** `remember()` siempre ejecuta el callback.

**Verificar:**
1. Redis está corriendo: `redis-cli ping`
2. RedisService está conectado
3. No estás usando `refresh: true`

```typescript
// Ver info del cache
const info = await this.cacheService.info();
console.log(info);
```

---

## 📚 Referencias

- **RedisService:** `src/shared/redis/redis.service.ts`
- **CacheService:** `src/modules/cache/cache.service.ts`
- **CacheController:** `src/modules/cache/cache.controller.ts`
- **Interfaces:** `src/modules/cache/interfaces/`

---

## 📝 Changelog

### v1.0.0 - Enero 2025
- ✅ Implementación inicial
- ✅ Método `remember()` con tags
- ✅ Invalidación por tags
- ✅ Estadísticas de uso
- ✅ Cache warmup
- ✅ 11 endpoints REST
- ✅ Integrado en UserModule

---

> **Última actualización:** Enero 2025 - Sesión 10
> **Mantenedor:** Equipo Backend
