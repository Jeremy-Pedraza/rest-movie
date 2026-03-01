// src/modules/type/interfaces/type-response.interface.ts

export interface ITypeResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
