// src/modules/producer/interfaces/producer-response.interface.ts

export interface IProducerResponse {
  id: string;
  name: string;
  slogan: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
