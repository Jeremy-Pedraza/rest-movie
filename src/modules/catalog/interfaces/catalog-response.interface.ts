// src/modules/catalog/interfaces/catalog-response.interface.ts

export interface ICatalogItemResponse {
  id: string;
  serial: string;
  title: string;
  synopsis: string | null;
  coverImage: string | null;
  releaseYear: number;
  genre: { id: string; name: string };
  director: { id: string; names: string };
  producer: { id: string; name: string };
  type: { id: string; name: string };
}

export interface ICatalogDetailResponse extends ICatalogItemResponse {
  url?: string;
}

export interface ICatalogFeaturedResponse {
  id: string;
  title: string;
  synopsis: string | null;
  coverImage: string | null;
  releaseYear: number;
  genre: { id: string; name: string };
  type: { id: string; name: string };
}

export interface ICatalogFilterResponse {
  id: string;
  name: string;
}
