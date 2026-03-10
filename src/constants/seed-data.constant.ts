import { DEFAULT_ROLES } from './roles.constant';

export const DEFAULT_GENRES = [
  { name: 'Accion', description: 'Peliculas con escenas de accion y combate', isActive: true },
  { name: 'Aventura', description: 'Peliculas de exploracion y aventuras', isActive: true },
  {
    name: 'Ciencia Ficcion',
    description: 'Peliculas basadas en conceptos cientificos y futuristas',
    isActive: true,
  },
  { name: 'Drama', description: 'Peliculas con narrativas emotivas y profundas', isActive: true },
  {
    name: 'Terror',
    description: 'Peliculas disenadas para generar miedo y suspenso',
    isActive: true,
  },
  { name: 'Comedia', description: 'Peliculas con humor y situaciones comicas', isActive: true },
  { name: 'Romance', description: 'Peliculas centradas en relaciones amorosas', isActive: true },
  {
    name: 'Animacion',
    description: 'Peliculas creadas con tecnicas de animacion',
    isActive: true,
  },
] as const;

export const DEFAULT_DIRECTORS = [
  { names: 'Christopher Nolan', isActive: true },
  { names: 'Steven Spielberg', isActive: true },
  { names: 'Martin Scorsese', isActive: true },
  { names: 'Quentin Tarantino', isActive: true },
  { names: 'James Cameron', isActive: true },
  { names: 'Ridley Scott', isActive: true },
] as const;

export const DEFAULT_PRODUCERS = [
  {
    name: 'Walt Disney Pictures',
    slogan: 'Where Dreams Come True',
    description: 'Compania de entretenimiento multinacional',
    isActive: true,
  },
  {
    name: 'Warner Bros. Pictures',
    slogan: 'If You Can Dream It, We Can Film It',
    description: 'Estudio de cine y entretenimiento',
    isActive: true,
  },
  {
    name: 'Paramount Pictures',
    slogan: 'A Viacom Company',
    description: 'Estudio cinematografico estadounidense',
    isActive: true,
  },
  {
    name: 'Metro-Goldwyn-Mayer',
    slogan: 'Ars Gratia Artis',
    description: 'Compania de medios estadounidense',
    isActive: true,
  },
  {
    name: 'Universal Pictures',
    slogan: null,
    description: 'Estudio de produccion cinematografica',
    isActive: true,
  },
  {
    name: '20th Century Studios',
    slogan: null,
    description: 'Estudio de produccion de peliculas y television',
    isActive: true,
  },
] as const;

export const DEFAULT_TYPES = [
  { name: 'Pelicula', description: 'Contenido audiovisual de larga duracion' },
  { name: 'Serie', description: 'Contenido audiovisual dividido en episodios y temporadas' },
] as const;

export const SEED_DATA = {
  roles: DEFAULT_ROLES,
  genres: DEFAULT_GENRES,
  directors: DEFAULT_DIRECTORS,
  producers: DEFAULT_PRODUCERS,
  types: DEFAULT_TYPES,
} as const;
