// src/modules/genre/interfaces/genre-response.interface.ts

export interface IGenreResponse {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
