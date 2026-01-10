// src/shared/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';

/**
 * DatabaseModule - Módulo compartido para utilidades de base de datos
 *
 * Proporciona servicios globales para manejo de transacciones
 * y otras utilidades de base de datos.
 *
 * Este módulo es @Global, por lo que sus exports están disponibles
 * en toda la aplicación sin necesidad de importarlo.
 *
 * @example
 * ```typescript
 * // En cualquier service
 * @Injectable()
 * export class OrderService {
 *   constructor(private readonly transactionService: TransactionService) {}
 *
 *   async createOrder(dto: CreateOrderDto) {
 *     return this.transactionService.execute(async (manager) => {
 *       // operaciones en transacción...
 *     });
 *   }
 * }
 * ```
 */
@Global()
@Module({
  providers: [TransactionService],
  exports: [TransactionService],
})
export class DatabaseModule {}
