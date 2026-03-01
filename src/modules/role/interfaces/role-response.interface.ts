// src/modules/role/interfaces/role-response.interface.ts

export interface IRoleResponse {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
