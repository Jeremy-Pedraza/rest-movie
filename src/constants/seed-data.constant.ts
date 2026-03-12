import { DEFAULT_ROLES } from './roles.constant';
import { GENERATED_REAL_MOVIES } from './generated-real-movies.constant';
import { GENERATED_REAL_SERIES } from './generated-real-series.constant';

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
  {
    name: 'DreamWorks Pictures',
    slogan: null,
    description: 'Estudio cinematografico estadounidense fundado en 1994',
    isActive: true,
  },
  {
    name: 'Miramax Films',
    slogan: null,
    description: 'Compania de produccion y distribucion de cine',
    isActive: true,
  },
] as const;

export const DEFAULT_TYPES = [
  { name: 'Pelicula', description: 'Contenido audiovisual de larga duracion' },
  { name: 'Serie', description: 'Contenido audiovisual dividido en episodios y temporadas' },
] as const;

type SeedMediaDefinition = {
  serial: string;
  title: string;
  synopsis: string;
  url: string;
  coverImage: string;
  releaseYear: number;
  genreName: (typeof DEFAULT_GENRES)[number]['name'];
  directorName: (typeof DEFAULT_DIRECTORS)[number]['names'];
  producerName: (typeof DEFAULT_PRODUCERS)[number]['name'];
  typeName: (typeof DEFAULT_TYPES)[number]['name'];
};

type GenreSeedConfig = {
  movieTitles: readonly string[];
  seriesTitles: readonly string[];
  movieSynopsis: string;
  seriesSynopsis: string;
};

const DIRECTOR_ROTATION = DEFAULT_DIRECTORS.map((director) => director.names);
const PRODUCER_ROTATION = DEFAULT_PRODUCERS.map((producer) => producer.name);

const GENRE_MEDIA_CONFIG: Record<(typeof DEFAULT_GENRES)[number]['name'], GenreSeedConfig> = {
  Accion: {
    movieTitles: [
      'Impacto Final',
      'Zona de Asalto',
      'Codigo de Acero',
      'Furia Nocturna',
      'Operacion Centella',
      'Pulso de Guerra',
      'Contraataque Urbano',
      'Veloz y Letal',
      'Objetivo Sombra',
      'Ruta de Escape',
      'Blindaje Rojo',
      'Tension Maxima',
      'Ultima Intercepcion',
      'Ataque Relampago',
      'Comando Delta',
      'Cerco Inminente',
      'Rescate Terminal',
      'Punto de Ruptura',
      'Mision Extrema',
      'Alerta de Impacto',
    ],
    seriesTitles: [
      'Escuadron de Choque',
      'Linea de Fuego',
      'Ciudad Bajo Sitio',
      'Operadores',
      'Pulso Tactico',
      'Frontera Roja',
      'Guardianes de Asalto',
      'Fase de Ataque',
      'Comando Eclipse',
      'Zona Letal',
      'Fuerza de Respuesta',
      'Unidad Relampago',
      'Vector de Riesgo',
      'Mision Perimetral',
      'Codigo de Batalla',
      'Area de Conflicto',
      'Tiempo de Impacto',
      'Brigada Fantasma',
      'Alcance Maximo',
      'Senal de Guerra',
    ],
    movieSynopsis:
      'Una amenaza fuera de control obliga a un equipo de elite a ejecutar una operacion de alto riesgo entre persecuciones, combate y decisiones bajo presion.',
    seriesSynopsis:
      'Cada temporada sigue a una unidad especializada que enfrenta crisis armadas, conspiraciones y rescates imposibles en distintos frentes.',
  },
  Aventura: {
    movieTitles: [
      'Mapa del Horizonte',
      'La Isla de Bronce',
      'Selva de Cristal',
      'Travesia del Norte',
      'El Valle Perdido',
      'Ecos del Oceano',
      'Camino de Titanes',
      'La Ruta Esmeralda',
      'Montana sin Fin',
      'El Tesoro del Viento',
      'Expedicion Aurora',
      'El Reino Sumergido',
      'Sendero Salvaje',
      'Cronica del Navegante',
      'Puerta al Desierto',
      'La Brijula Dorada',
      'Estacion del Jaguar',
      'La Cueva Celeste',
      'Territorio Indomito',
      'Puente de Nubes',
    ],
    seriesTitles: [
      'Rumbo a lo Desconocido',
      'Expedientes del Atlas',
      'Navegantes',
      'La Liga Exploradora',
      'Bitacora Salvaje',
      'Puertos del Mundo',
      'Guardianes del Mapa',
      'Cartografos',
      'Tribu del Horizonte',
      'Aventura Central',
      'Campamento Boreal',
      'Cronicas del Sendero',
      'Tierras Remotas',
      'Los Descubridores',
      'Mareas del Sur',
      'Circuito de Expedicion',
      'Estrella del Camino',
      'El Cuaderno Perdido',
      'La Ruta Secreta',
      'Territorio Abierto',
    ],
    movieSynopsis:
      'Una expedicion improbable se adentra en territorios desconocidos para resolver un misterio antiguo y regresar con vida.',
    seriesSynopsis:
      'Un grupo de exploradores viaja por regiones extremas mientras descubre reliquias, leyendas y amenazas que cambian su destino.',
  },
  'Ciencia Ficcion': {
    movieTitles: [
      'Orbita de Silicio',
      'Protocolo Andromeda',
      'Nebula Cero',
      'Codigo Estelar',
      'Matriz de Titanio',
      'El Horizonte Quantico',
      'Planeta Umbral',
      'Archivo Helix',
      'Vector Galactico',
      'Anomalia 9',
      'Transito Lunar',
      'Dominio Neural',
      'La Ultima Colonia',
      'Motor de Vacuo',
      'Paradoja Solar',
      'Genesis Binario',
      'Portal Horizonte',
      'Frecuencia de Marte',
      'Sector Infinito',
      'Eclipse de Neon',
    ],
    seriesTitles: [
      'Distrito Orbital',
      'Cronicas del Vacuo',
      'Materia Oscura',
      'Helix Prime',
      'Estacion Zenith',
      'Trama Cuantica',
      'Colonias del Borde',
      'Memoria Sintetica',
      'Ruta Interplanetaria',
      'Horizonte Nexo',
      'Naves de Titan',
      'Codigo de Singularidad',
      'Paralelo 12',
      'Pioneros de Europa',
      'Laboratorio Delta',
      'Amanecer en Proxima',
      'Sistemas en Guerra',
      'Luz de Antimateria',
      'Sector Lambda',
      'Archivo del Futuro',
    ],
    movieSynopsis:
      'Un avance tecnologico altera el equilibrio del mundo y empuja a sus protagonistas a enfrentar inteligencia artificial, viajes espaciales y dilemas humanos.',
    seriesSynopsis:
      'La serie sigue a cientificos, pilotos y colonos mientras intentan sobrevivir a un futuro marcado por tecnologia extrema y conflictos interestelares.',
  },
  Drama: {
    movieTitles: [
      'La Ultima Carta',
      'Casa de Invierno',
      'El Peso del Silencio',
      'Dias de Ceniza',
      'La Vida Prestada',
      'Cuarto 17',
      'Cuando Vuelva la Lluvia',
      'Herencia de Cristal',
      'Los que Esperan',
      'Tiempo de Partir',
      'Nombres en la Arena',
      'El Muro Invisible',
      'Domingo de Agosto',
      'La Ciudad Interior',
      'Vidas Cruzadas',
      'A Fuego Lento',
      'Despues del Eco',
      'La Mesa Vacía',
      'Instante de Quiebre',
      'El Ultimo Acuerdo',
    ],
    seriesTitles: [
      'Familia de Paso',
      'Barrio Central',
      'La Casa de al Lado',
      'Sombras Cotidianas',
      'Vidas Paralelas',
      'Habitaciones',
      'La Herida Abierta',
      'Ciclos',
      'Segundas Oportunidades',
      'Bajo el Mismo Techo',
      'Cartas sin Destino',
      'Linea de Sangre',
      'Lo que Callamos',
      'Piso Doce',
      'La Otra Orilla',
      'Dias Prestados',
      'Punto de Encuentro',
      'El Precio del Tiempo',
      'Silencio Compartido',
      'Testigos',
    ],
    movieSynopsis:
      'Un conflicto personal y familiar obliga a sus protagonistas a confrontar secretos, perdidas y decisiones que cambian sus vidas.',
    seriesSynopsis:
      'La historia profundiza en relaciones humanas complejas, heridas emocionales y giros cotidianos que transforman a cada personaje.',
  },
  Terror: {
    movieTitles: [
      'La Casa del Umbral',
      'Susurros en el Sotano',
      'Noche de Hueso',
      'El Ultimo Ritual',
      'Habitacion 404',
      'Bosque de Ceniza',
      'La Mirada Vacia',
      'Pacto en la Niebla',
      'Silencio del Pozo',
      'Ceniza Negra',
      'Las Puertas Rojas',
      'Vigilia',
      'El Visitante del Techo',
      'Sombra en la Pared',
      'El Eco del Abismo',
      'Madrugada Sin Nombre',
      'Piel Fria',
      'La Herencia Maldita',
      'Pasillo 13',
      'La Dama del Lago',
    ],
    seriesTitles: [
      'Archivo Paranormal',
      'Casas Muertas',
      'El Culto',
      'Noches de Vigilia',
      'Umbral',
      'Habitantes',
      'La Hora Oscura',
      'Diario del Exorcista',
      'Bosque Negro',
      'Sombras de Medianoche',
      'Objetos Malditos',
      'El Corredor',
      'La Voz del Silo',
      'Ritos',
      'Pueblo de Ceniza',
      'Nadie Duerme',
      'El Ultimo Refugio',
      'Espectros',
      'Bajo la Escalera',
      'Murmullos',
    ],
    movieSynopsis:
      'Una presencia inexplicable comienza a perseguir a quienes desentierran un secreto prohibido que nadie debio tocar.',
    seriesSynopsis:
      'Cada episodio expande una red de apariciones, cultos y maldiciones que conecta tragedias antiguas con horrores actuales.',
  },
  Comedia: {
    movieTitles: [
      'Plan Casi Perfecto',
      'Vecinos en Problemas',
      'La Boda Improvisada',
      'Error de Reparto',
      'Jefe por Accidente',
      'Manual para Meter la Pata',
      'Semana de Locos',
      'La Mudanza',
      'Tres Días sin Filtro',
      'Un Favor Complicado',
      'Oficina de Desastres',
      'Vacaciones en Ruinas',
      'El Candidato Equivocado',
      'Cumpleanos Sorpresa',
      'Clases de Caos',
      'Mision Sin Talento',
      'La Familia Prestada',
      'Novios a Prueba',
      'Taxi Compartido',
      'Gente con Suerte',
    ],
    seriesTitles: [
      'Apartamento 6B',
      'Los Improvisados',
      'Trabajo Inestable',
      'Se Alquila Risa',
      'Jefes y Becarios',
      'Mala Idea',
      'Mesa para Cinco',
      'Pension Completa',
      'Los del Fondo',
      'Familia en Oferta',
      'Turno Partido',
      'Caos Organizado',
      'Casi Adultos',
      'No Era el Plan',
      'Error Compartido',
      'El Grupo',
      'Piso Libre',
      'Amigos con Multa',
      'Horario Flexible',
      'Bienvenidos Tarde',
    ],
    movieSynopsis:
      'Una cadena de malentendidos convierte una situacion cotidiana en un desastre hilarante del que nadie sale intacto.',
    seriesSynopsis:
      'Un grupo de personajes incompatibles intenta convivir y trabajar mientras cada episodio empeora lo que parecia un problema menor.',
  },
  Romance: {
    movieTitles: [
      'Cartas de Abril',
      'Antes del Amanecer',
      'Lo que Dice el Mar',
      'Un Lugar para Volver',
      'Cafe de Medianoche',
      'El Tiempo que Nos Queda',
      'Bajo la Misma Lluvia',
      'Verano para Dos',
      'Te Encontre Tarde',
      'Un Segundo Intento',
      'A Orillas del Recuerdo',
      'La Promesa Azul',
      'Distancia Corta',
      'Luz de Domingo',
      'Tu Nombre en Invierno',
      'Entre Estaciones',
      'Todo lo que Falta',
      'Rumbo al Corazon',
      'Mirarte Otra Vez',
      'Nuestro Ultimo Tren',
    ],
    seriesTitles: [
      'Historias del Corazon',
      'Cita en la Ciudad',
      'Lo Nuestro',
      'Amar sin Mapa',
      'Temporada de Besos',
      'Punto de Encuentro',
      'Cartas Cruzadas',
      'El Cafe de Siempre',
      'Cuando Coincidimos',
      'Segunda Mirada',
      'Tu y el Tiempo',
      'Kilometros de Distancia',
      'Mar de Fondo',
      'Notas para Quererte',
      'Amor en Pausa',
      'Dias Contados',
      'La Ruta de Regreso',
      'Entre Dos Mundos',
      'Cada Jueves',
      'Nosotros Despues',
    ],
    movieSynopsis:
      'Dos personas con pasados muy distintos descubren que el amor tambien exige decisiones dificiles, renuncias y valentia.',
    seriesSynopsis:
      'La serie recorre encuentros, separaciones y reencuentros mientras varias historias sentimentales se cruzan a lo largo del tiempo.',
  },
  Animacion: {
    movieTitles: [
      'Reino de Papel',
      'El Pequeno Cometa',
      'Bosque de Azucar',
      'Capitan Luciernaga',
      'Ciudad de Juguete',
      'El Viaje de Nilo',
      'Guardianes del Color',
      'La Fabrica de Nubes',
      'Corazon de Madera',
      'La Isla de los Inventos',
      'Reloj de Estrellas',
      'Bailar con Dragones',
      'El Tren de la Luna',
      'Una Casa en el Arbol',
      'Mision Arcoiris',
      'Cuento de Invierno',
      'Taller de Suenos',
      'El Faro Azul',
      'Princesa del Viento',
      'El Gigante de Carton',
    ],
    seriesTitles: [
      'Aventuras de Lumo',
      'La Pandilla del Bosque',
      'Mini Exploradores',
      'Robot y Rana',
      'Las Cronicas de Tiza',
      'Planeta de Colores',
      'Capitanes del Patio',
      'El Club del Arcoiris',
      'Inventores en Casa',
      'Guardianes Chiquitos',
      'Mundo de Papel',
      'Tren de Fantasia',
      'Nube 7',
      'El Taller Magico',
      'Viajeros del Cuento',
      'La Banda del Faro',
      'Estrellas del Jardin',
      'Monstruos Amables',
      'La Isla Feliz',
      'Patrulla de Juguetes',
    ],
    movieSynopsis:
      'Personajes entrañables emprenden una aventura luminosa que combina amistad, imaginacion y una leccion para toda la familia.',
    seriesSynopsis:
      'Cada episodio presenta retos fantasticos, humor y aprendizaje con heroes animados que cooperan para resolver problemas creativamente.',
  },
};

function buildTrailerUrl(
  title: string,
  typeName: (typeof DEFAULT_TYPES)[number]['name'],
  genreName: (typeof DEFAULT_GENRES)[number]['name'],
): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${title} ${typeName} ${genreName} official trailer`,
  )}`;
}

function buildCoverImage(serial: string, title: string): string {
  return `https://picsum.photos/seed/${slugify(`${serial}-${title}`)}/800/1200`;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createMediaByType(
  typeName: (typeof DEFAULT_TYPES)[number]['name'],
  serialPrefix: 'MOV' | 'SER',
  startYear: number,
): SeedMediaDefinition[] {
  const isMovie = typeName === 'Pelicula';
  let serialCounter = 1;

  return DEFAULT_GENRES.flatMap((genre, genreIndex) => {
    const config = GENRE_MEDIA_CONFIG[genre.name];
    const titles = isMovie ? config.movieTitles : config.seriesTitles;

    return titles.map((title, itemIndex) => {
      const serial = `${serialPrefix}-${String(serialCounter++).padStart(3, '0')}`;
      const rotationIndex = genreIndex * titles.length + itemIndex;

      return {
        serial,
        title,
        synopsis: isMovie ? config.movieSynopsis : config.seriesSynopsis,
        url: buildTrailerUrl(title, typeName, genre.name),
        coverImage: buildCoverImage(serial, title),
        releaseYear: startYear + ((genreIndex * 3 + itemIndex) % 24),
        genreName: genre.name,
        directorName: DIRECTOR_ROTATION[rotationIndex % DIRECTOR_ROTATION.length],
        producerName: PRODUCER_ROTATION[rotationIndex % PRODUCER_ROTATION.length],
        typeName,
      };
    });
  });
}

export const DEFAULT_MEDIA = [
  ...GENERATED_REAL_MOVIES,
  ...GENERATED_REAL_SERIES,
] as const satisfies readonly SeedMediaDefinition[];

export const SEED_DATA = {
  roles: DEFAULT_ROLES,
  genres: DEFAULT_GENRES,
  directors: DEFAULT_DIRECTORS,
  producers: DEFAULT_PRODUCERS,
  types: DEFAULT_TYPES,
  media: DEFAULT_MEDIA,
} as const;
