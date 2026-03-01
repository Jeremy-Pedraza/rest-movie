// src/@types/express.d.ts

declare global {
  namespace Express {
    interface Request {
      /**
       * ID unico de la peticion (UUIDv7)
       */
      requestId?: string;

      /**
       * Timestamp de inicio de la peticion
       */
      startTime?: number;
    }
  }
}

export {};
