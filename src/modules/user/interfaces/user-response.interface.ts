// src/modules/user/interfaces/user-response.interface.ts

export interface IUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: { id: string; name: string }[];
  createdAt: Date;
  updatedAt: Date;
}
