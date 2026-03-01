// src/modules/media/interfaces/media-response.interface.ts

export interface IMediaResponse {
  id: string;
  serial: string;
  title: string;
  synopsis: string | null;
  url: string;
  coverImage: string | null;
  releaseYear: number;
  genreId: string;
  directorId: string;
  producerId: string;
  typeId: string;
  genre?: {
    id: string;
    name: string;
  };
  director?: {
    id: string;
    names: string;
  };
  producer?: {
    id: string;
    name: string;
  };
  type?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
