// src/database/seeds/store.seed.ts

/**
 * @fileoverview Seed de tiendas Taco Bell República Dominicana
 * @module database/seeds
 *
 * Crea 20 tiendas distribuidas en:
 * - Santo Domingo (10 tiendas)
 * - Santiago (2 tiendas)
 * - Punta Cana / Bávaro (2 tiendas)
 * - La Romana (1 tienda)
 * - Higüey (1 tienda)
 * - San Cristóbal (1 tienda)
 * - San Francisco de Macorís (1 tienda)
 * - La Vega (1 tienda)
 * - Puerto Plata (1 tienda)
 */

import { DataSource } from 'typeorm';
import { StoreEntity } from '@modules/store/entities';
import { CompanyEntity } from '@modules/company/entities';
import { GeoCityEntity } from '@modules/geography/entities';

/**
 * Mapa de ciudad del store → nombre de ciudad en el catálogo geográfico
 * (usa nombres normalizados o aliases del seed de geografía)
 */
const CITY_LOOKUP: Record<string, string[]> = {
  'Santo Domingo': ['Santo Domingo'],
  Santiago: ['Santiago', 'Santiago de los Caballeros'],
  'Punta Cana': ['Punta Cana', 'Higuey', 'Salvaleon de Higuey'],
  'La Romana': ['La Romana'],
  Higüey: ['Higuey', 'Salvaleon de Higuey'],
  'San Cristóbal': ['San Cristobal'],
  'San Francisco de Macorís': ['San Francisco de Macoris', 'SFM'],
  'La Vega': ['La Vega', 'Concepcion de La Vega'],
  'Puerto Plata': ['Puerto Plata', 'San Felipe de Puerto Plata'],
};

interface StoreSeedData {
  nombre: string;
  codigo: string;
  direccion: string;
  ciudad: string;
  email: string;
  telefono: string;
  zona: string;
  latitud: number;
  longitud: number;
  region: string;
  location_type: string;
  store_format: string;
  seating_capacity: number;
  sales_tier: string;
  has_drive_thru: boolean;
  has_delivery: boolean;
  operating_hours: Record<string, { open: string; close: string }>;
  opening_date: string;
  manager_name: string;
  tags: string[];
  activo: boolean;
  metadata: Record<string, any>;
}

const STORE_DEFINITIONS: StoreSeedData[] = [
  // ── Santo Domingo (10 tiendas) ──────────────────────────────
  {
    nombre: 'Taco Bell - Máximo Gómez',
    codigo: 'TB-SD-001',
    direccion: 'Av. Máximo Gómez #100, esq. Av. 27 de Febrero',
    ciudad: 'Santo Domingo',
    email: 'tb.maximo.gomez@tacobell.com.do',
    telefono: '+1-809-555-1001',
    zona: 'Ensanche La Paz',
    latitud: 18.4752,
    longitud: -69.9178,
    region: 'Metropolitana',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 65,
    sales_tier: 'A',
    has_drive_thru: true,
    has_delivery: true,
    operating_hours: {
      monday: { open: '08:00', close: '23:00' },
      tuesday: { open: '08:00', close: '23:00' },
      wednesday: { open: '08:00', close: '23:00' },
      thursday: { open: '08:00', close: '23:00' },
      friday: { open: '08:00', close: '00:00' },
      saturday: { open: '09:00', close: '00:00' },
      sunday: { open: '10:00', close: '22:00' },
    },
    opening_date: '2018-03-10',
    manager_name: 'Carlos Rodríguez',
    tags: ['drive-thru', 'wifi'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-001' },
  },
  {
    nombre: 'Taco Bell - Lope de Vega',
    codigo: 'TB-SD-002',
    direccion: 'Av. Lope de Vega #13, esq. Av. México',
    ciudad: 'Santo Domingo',
    email: 'tb.lope.de.vega@tacobell.com.do',
    telefono: '+1-809-555-1002',
    zona: 'Gazcue',
    latitud: 18.4621,
    longitud: -69.9123,
    region: 'Metropolitana',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 55,
    sales_tier: 'B',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '11:00', close: '21:00' },
    },
    opening_date: '2015-11-20',
    manager_name: 'Ana María Fermín',
    tags: ['wifi', 'estacionamiento'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-002' },
  },
  {
    nombre: 'Taco Bell - Núñez de Cáceres',
    codigo: 'TB-SD-003',
    direccion: 'Av. Núñez de Cáceres esq. Av. Rómulo Betancourt',
    ciudad: 'Santo Domingo',
    email: 'tb.nunez.caceres@tacobell.com.do',
    telefono: '+1-809-555-1003',
    zona: 'Bella Vista',
    latitud: 18.4567,
    longitud: -69.9354,
    region: 'Metropolitana',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 70,
    sales_tier: 'A',
    has_drive_thru: true,
    has_delivery: true,
    operating_hours: {
      monday: { open: '08:00', close: '23:00' },
      tuesday: { open: '08:00', close: '23:00' },
      wednesday: { open: '08:00', close: '23:00' },
      thursday: { open: '08:00', close: '23:00' },
      friday: { open: '08:00', close: '00:00' },
      saturday: { open: '09:00', close: '00:00' },
      sunday: { open: '10:00', close: '22:00' },
    },
    opening_date: '2019-07-22',
    manager_name: 'Pedro Suárez',
    tags: ['drive-thru', 'wifi', 'remodelado'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-003' },
  },
  {
    nombre: 'Taco Bell - Winston Churchill',
    codigo: 'TB-SD-004',
    direccion: 'Av. Winston Churchill esq. Gustavo Mejía Ricart',
    ciudad: 'Santo Domingo',
    email: 'tb.winston.churchill@tacobell.com.do',
    telefono: '+1-809-555-1004',
    zona: 'Piantini',
    latitud: 18.4702,
    longitud: -69.9448,
    region: 'Metropolitana',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 80,
    sales_tier: 'A',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '08:00', close: '23:00' },
      tuesday: { open: '08:00', close: '23:00' },
      wednesday: { open: '08:00', close: '23:00' },
      thursday: { open: '08:00', close: '23:00' },
      friday: { open: '08:00', close: '00:00' },
      saturday: { open: '09:00', close: '00:00' },
      sunday: { open: '10:00', close: '22:00' },
    },
    opening_date: '2016-05-18',
    manager_name: 'Laura Jiménez',
    tags: ['wifi', 'terraza', 'alto tráfico'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-004' },
  },
  {
    nombre: 'Taco Bell - Sarasota',
    codigo: 'TB-SD-005',
    direccion: 'Av. Sarasota esq. Arrayanes',
    ciudad: 'Santo Domingo',
    email: 'tb.sarasota@tacobell.com.do',
    telefono: '+1-809-555-1005',
    zona: 'Bella Vista',
    latitud: 18.4509,
    longitud: -69.9287,
    region: 'Metropolitana',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 60,
    sales_tier: 'B',
    has_drive_thru: true,
    has_delivery: true,
    operating_hours: {
      monday: { open: '08:00', close: '23:00' },
      tuesday: { open: '08:00', close: '23:00' },
      wednesday: { open: '08:00', close: '23:00' },
      thursday: { open: '08:00', close: '23:00' },
      friday: { open: '08:00', close: '23:30' },
      saturday: { open: '09:00', close: '23:30' },
      sunday: { open: '10:00', close: '22:00' },
    },
    opening_date: '2017-10-05',
    manager_name: 'Roberto Díaz',
    tags: ['drive-thru', 'wifi'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-005' },
  },
  {
    nombre: 'Taco Bell - Galería 360',
    codigo: 'TB-SD-006',
    direccion: 'Av. John F. Kennedy, Galería 360, Local F-12',
    ciudad: 'Santo Domingo',
    email: 'tb.galeria360@tacobell.com.do',
    telefono: '+1-809-555-1006',
    zona: 'La Julia',
    latitud: 18.4815,
    longitud: -69.9321,
    region: 'Metropolitana',
    location_type: 'mall',
    store_format: 'kiosk',
    seating_capacity: 45,
    sales_tier: 'A',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '10:00', close: '21:00' },
      tuesday: { open: '10:00', close: '21:00' },
      wednesday: { open: '10:00', close: '21:00' },
      thursday: { open: '10:00', close: '21:00' },
      friday: { open: '10:00', close: '22:00' },
      saturday: { open: '10:00', close: '22:00' },
      sunday: { open: '11:00', close: '20:00' },
    },
    opening_date: '2022-04-15',
    manager_name: 'Carolina Mota',
    tags: ['mall', 'nuevo'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-006' },
  },
  {
    nombre: 'Taco Bell - Blue Mall',
    codigo: 'TB-SD-007',
    direccion: 'Av. Winston Churchill, Blue Mall, Local 2B',
    ciudad: 'Santo Domingo',
    email: 'tb.bluemall@tacobell.com.do',
    telefono: '+1-809-555-1007',
    zona: 'Piantini',
    latitud: 18.4739,
    longitud: -69.9456,
    region: 'Metropolitana',
    location_type: 'mall',
    store_format: 'kiosk',
    seating_capacity: 50,
    sales_tier: 'A',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '10:00', close: '21:00' },
      tuesday: { open: '10:00', close: '21:00' },
      wednesday: { open: '10:00', close: '21:00' },
      thursday: { open: '10:00', close: '21:00' },
      friday: { open: '10:00', close: '22:00' },
      saturday: { open: '10:00', close: '22:00' },
      sunday: { open: '11:00', close: '20:00' },
    },
    opening_date: '2022-10-10',
    manager_name: 'Fernando Castro',
    tags: ['mall', 'wifi', 'exclusivo'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-017' },
  },
  {
    nombre: 'Taco Bell - Acrópolis Center',
    codigo: 'TB-SD-008',
    direccion: 'Av. Winston Churchill, Acrópolis Center, Local F-15',
    ciudad: 'Santo Domingo',
    email: 'tb.acropolis@tacobell.com.do',
    telefono: '+1-809-555-1008',
    zona: 'Serallés',
    latitud: 18.4682,
    longitud: -69.9423,
    region: 'Metropolitana',
    location_type: 'mall',
    store_format: 'kiosk',
    seating_capacity: 45,
    sales_tier: 'B',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '10:00', close: '21:00' },
      tuesday: { open: '10:00', close: '21:00' },
      wednesday: { open: '10:00', close: '21:00' },
      thursday: { open: '10:00', close: '21:00' },
      friday: { open: '10:00', close: '22:00' },
      saturday: { open: '10:00', close: '22:00' },
      sunday: { open: '11:00', close: '20:00' },
    },
    opening_date: '2020-08-15',
    manager_name: 'Patricia Jiménez',
    tags: ['mall', 'wifi'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-018' },
  },
  {
    nombre: 'Taco Bell - Megacentro',
    codigo: 'TB-SD-009',
    direccion: 'Av. San Vicente de Paúl, Megacentro, Local F-22',
    ciudad: 'Santo Domingo',
    email: 'tb.megacentro@tacobell.com.do',
    telefono: '+1-809-555-1009',
    zona: 'Los Mina',
    latitud: 18.4928,
    longitud: -69.8859,
    region: 'Metropolitana',
    location_type: 'mall',
    store_format: 'kiosk',
    seating_capacity: 55,
    sales_tier: 'B',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '10:00', close: '21:00' },
      tuesday: { open: '10:00', close: '21:00' },
      wednesday: { open: '10:00', close: '21:00' },
      thursday: { open: '10:00', close: '21:00' },
      friday: { open: '10:00', close: '22:00' },
      saturday: { open: '10:00', close: '22:00' },
      sunday: { open: '11:00', close: '20:00' },
    },
    opening_date: '2017-06-20',
    manager_name: 'Ricardo Sánchez',
    tags: ['mall', 'wifi', 'alto tráfico'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-019' },
  },
  {
    nombre: 'Taco Bell - Downtown Center',
    codigo: 'TB-SD-010',
    direccion: 'Av. Núñez de Cáceres esq. Av. Winston Churchill',
    ciudad: 'Santo Domingo',
    email: 'tb.downtowncenter@tacobell.com.do',
    telefono: '+1-809-555-1010',
    zona: 'Piantini',
    latitud: 18.4715,
    longitud: -69.9412,
    region: 'Metropolitana',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 75,
    sales_tier: 'A',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '08:00', close: '23:00' },
      tuesday: { open: '08:00', close: '23:00' },
      wednesday: { open: '08:00', close: '23:00' },
      thursday: { open: '08:00', close: '23:00' },
      friday: { open: '08:00', close: '00:00' },
      saturday: { open: '09:00', close: '00:00' },
      sunday: { open: '10:00', close: '22:00' },
    },
    opening_date: '2023-12-01',
    manager_name: 'Sofía Peña',
    tags: ['nuevo', 'remodelado', 'wifi', 'terraza'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-020' },
  },

  // ── Santiago (2 tiendas) ──────────────────────────────
  {
    nombre: 'Taco Bell - Santiago Centro',
    codigo: 'TB-ST-001',
    direccion: 'Av. 27 de Febrero #105, esquina Av. Estrella Sadhalá',
    ciudad: 'Santiago',
    email: 'tb.santiago.centro@tacobell.com.do',
    telefono: '+1-809-555-2001',
    zona: 'Centro',
    latitud: 19.4567,
    longitud: -70.7056,
    region: 'Norte',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 75,
    sales_tier: 'A',
    has_drive_thru: true,
    has_delivery: true,
    operating_hours: {
      monday: { open: '08:00', close: '23:00' },
      tuesday: { open: '08:00', close: '23:00' },
      wednesday: { open: '08:00', close: '23:00' },
      thursday: { open: '08:00', close: '23:00' },
      friday: { open: '08:00', close: '00:00' },
      saturday: { open: '09:00', close: '00:00' },
      sunday: { open: '10:00', close: '22:00' },
    },
    opening_date: '2014-02-28',
    manager_name: 'José Ramírez',
    tags: ['drive-thru', 'wifi', 'alto tráfico'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-007' },
  },
  {
    nombre: 'Taco Bell - Santiago Norte',
    codigo: 'TB-ST-002',
    direccion: 'Av. Circunvalación Norte, Plaza La Sirena',
    ciudad: 'Santiago',
    email: 'tb.santiago.norte@tacobell.com.do',
    telefono: '+1-809-555-2002',
    zona: 'Reparto Universitario',
    latitud: 19.4763,
    longitud: -70.7152,
    region: 'Norte',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 60,
    sales_tier: 'B',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '11:00', close: '21:00' },
    },
    opening_date: '2020-09-12',
    manager_name: 'Marta Santana',
    tags: ['wifi', 'nuevo'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-008' },
  },

  // ── Punta Cana / Bávaro (2 tiendas) ──────────────────
  {
    nombre: 'Taco Bell - Punta Cana Downtown',
    codigo: 'TB-PC-001',
    direccion: 'Downtown Punta Cana, Local 7A, Blvd. El Dorado',
    ciudad: 'Punta Cana',
    email: 'tb.puntacana.downtown@tacobell.com.do',
    telefono: '+1-809-555-3001',
    zona: 'El Dorado',
    latitud: 18.5712,
    longitud: -68.4153,
    region: 'Este',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 90,
    sales_tier: 'A',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '10:00', close: '23:00' },
      tuesday: { open: '10:00', close: '23:00' },
      wednesday: { open: '10:00', close: '23:00' },
      thursday: { open: '10:00', close: '23:00' },
      friday: { open: '10:00', close: '00:00' },
      saturday: { open: '10:00', close: '00:00' },
      sunday: { open: '10:00', close: '23:00' },
    },
    opening_date: '2023-02-10',
    manager_name: 'Luis Pérez',
    tags: ['nuevo', 'turístico', 'wifi'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-009' },
  },
  {
    nombre: 'Taco Bell - Bávaro',
    codigo: 'TB-PC-002',
    direccion: 'Plaza San Juan, Av. Barceló, Bávaro',
    ciudad: 'Punta Cana',
    email: 'tb.bavaro@tacobell.com.do',
    telefono: '+1-809-555-3002',
    zona: 'Bávaro',
    latitud: 18.6534,
    longitud: -68.4521,
    region: 'Este',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 70,
    sales_tier: 'A',
    has_drive_thru: true,
    has_delivery: true,
    operating_hours: {
      monday: { open: '09:00', close: '23:00' },
      tuesday: { open: '09:00', close: '23:00' },
      wednesday: { open: '09:00', close: '23:00' },
      thursday: { open: '09:00', close: '23:00' },
      friday: { open: '09:00', close: '00:00' },
      saturday: { open: '09:00', close: '00:00' },
      sunday: { open: '10:00', close: '23:00' },
    },
    opening_date: '2023-08-25',
    manager_name: 'María Reyes',
    tags: ['nuevo', 'drive-thru', 'playa'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-010' },
  },

  // ── La Romana (1 tienda) ──────────────────────────────
  {
    nombre: 'Taco Bell - La Romana',
    codigo: 'TB-LR-001',
    direccion: 'Av. Santa Rosa esq. Libertad, Plaza Romana',
    ciudad: 'La Romana',
    email: 'tb.laromana@tacobell.com.do',
    telefono: '+1-809-555-4001',
    zona: 'Santa Rosa',
    latitud: 18.4289,
    longitud: -68.9783,
    region: 'Este',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 55,
    sales_tier: 'B',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '11:00', close: '21:00' },
    },
    opening_date: '2021-11-18',
    manager_name: 'Rafael Cedeño',
    tags: ['wifi'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-011' },
  },

  // ── Higüey (1 tienda) ────────────────────────────────
  {
    nombre: 'Taco Bell - Higüey',
    codigo: 'TB-LR-002',
    direccion: 'Av. Altagracia #45, esq. Sánchez',
    ciudad: 'Higüey',
    email: 'tb.higuey@tacobell.com.do',
    telefono: '+1-809-555-4002',
    zona: 'Centro',
    latitud: 18.6189,
    longitud: -68.7178,
    region: 'Este',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 50,
    sales_tier: 'C',
    has_drive_thru: true,
    has_delivery: true,
    operating_hours: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:00' },
      saturday: { open: '09:00', close: '23:00' },
      sunday: { open: '10:00', close: '21:00' },
    },
    opening_date: '2022-06-30',
    manager_name: 'Diana Guerrero',
    tags: ['drive-thru', 'provincia'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-012' },
  },

  // ── San Cristóbal (1 tienda) ──────────────────────────
  {
    nombre: 'Taco Bell - San Cristóbal',
    codigo: 'TB-SC-001',
    direccion: 'Av. Constitución #50, Plaza Constitución',
    ciudad: 'San Cristóbal',
    email: 'tb.sancristobal@tacobell.com.do',
    telefono: '+1-809-555-5001',
    zona: 'Centro',
    latitud: 18.4176,
    longitud: -70.1089,
    region: 'Sur',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 55,
    sales_tier: 'B',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:00' },
      saturday: { open: '09:00', close: '23:00' },
      sunday: { open: '10:00', close: '21:00' },
    },
    opening_date: '2019-05-17',
    manager_name: 'Jorge Familia',
    tags: ['wifi'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-013' },
  },

  // ── San Francisco de Macorís (1 tienda) ───────────────
  {
    nombre: 'Taco Bell - San Francisco',
    codigo: 'TB-SFM-001',
    direccion: 'Av. Libertad #121, esq. Sánchez',
    ciudad: 'San Francisco de Macorís',
    email: 'tb.sanfrancisco@tacobell.com.do',
    telefono: '+1-809-555-6001',
    zona: 'Centro',
    latitud: 19.3023,
    longitud: -70.2546,
    region: 'Norte',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 60,
    sales_tier: 'B',
    has_drive_thru: true,
    has_delivery: true,
    operating_hours: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:00' },
      saturday: { open: '09:00', close: '23:00' },
      sunday: { open: '10:00', close: '21:00' },
    },
    opening_date: '2021-03-22',
    manager_name: 'Rosa Hernández',
    tags: ['drive-thru', 'nuevo'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-014' },
  },

  // ── La Vega (1 tienda) ────────────────────────────────
  {
    nombre: 'Taco Bell - La Vega',
    codigo: 'TB-LV-001',
    direccion: 'Av. Pedro A. Lluberes #44, Plaza El Paseo',
    ciudad: 'La Vega',
    email: 'tb.lavega@tacobell.com.do',
    telefono: '+1-809-555-7001',
    zona: 'Centro',
    latitud: 19.2221,
    longitud: -70.5328,
    region: 'Norte',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 50,
    sales_tier: 'C',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '22:30' },
      saturday: { open: '09:00', close: '22:30' },
      sunday: { open: '10:00', close: '20:00' },
    },
    opening_date: '2020-02-14',
    manager_name: 'Manuel Tavárez',
    tags: [],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-015' },
  },

  // ── Puerto Plata (1 tienda) ───────────────────────────
  {
    nombre: 'Taco Bell - Puerto Plata',
    codigo: 'TB-PP-001',
    direccion: 'Malecón de Puerto Plata #101, Plaza Turística',
    ciudad: 'Puerto Plata',
    email: 'tb.puertoplata@tacobell.com.do',
    telefono: '+1-809-555-8001',
    zona: 'Malecón',
    latitud: 19.8013,
    longitud: -70.6945,
    region: 'Norte',
    location_type: 'standalone',
    store_format: 'regular',
    seating_capacity: 70,
    sales_tier: 'B',
    has_drive_thru: false,
    has_delivery: true,
    operating_hours: {
      monday: { open: '10:00', close: '22:00' },
      tuesday: { open: '10:00', close: '22:00' },
      wednesday: { open: '10:00', close: '22:00' },
      thursday: { open: '10:00', close: '22:00' },
      friday: { open: '10:00', close: '23:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '11:00', close: '22:00' },
    },
    opening_date: '2018-12-01',
    manager_name: 'Carmen López',
    tags: ['vista al mar', 'turístico'],
    activo: true,
    metadata: { pos_type: 'micros', integration_id: 'TB-016' },
  },
];

/**
 * Normaliza un string para comparación (sin acentos, minúsculas)
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Busca el geo_city_id correspondiente para una ciudad del store
 */
async function findGeoCityId(
  cityRepo: ReturnType<DataSource['getRepository']>,
  storeCiudad: string,
): Promise<string | null> {
  const lookupNames = CITY_LOOKUP[storeCiudad];
  if (!lookupNames) return null;

  for (const name of lookupNames) {
    // Buscar por nombre normalizado
    const city = await cityRepo
      .createQueryBuilder('city')
      .where('city.name_normalized = :normalized', {
        normalized: normalize(name),
      })
      .getOne();

    if (city) return city.id;

    // Buscar en aliases
    const cityByAlias = await cityRepo
      .createQueryBuilder('city')
      .where(':alias = ANY(city.aliases)', { alias: name })
      .getOne();

    if (cityByAlias) return cityByAlias.id;
  }

  return null;
}

/**
 * Seed de tiendas Taco Bell RD
 *
 * Requiere que se hayan ejecutado previamente:
 * - seedGeography (para geo_city_id)
 * - seedCompanies (para company_id)
 */
export async function seedStores(dataSource: DataSource): Promise<void> {
  const storeRepo = dataSource.getRepository(StoreEntity);
  const companyRepo = dataSource.getRepository(CompanyEntity);
  const cityRepo = dataSource.getRepository(GeoCityEntity);

  console.log('\n┌────────────────────────────────────────────────────┐');
  console.log('│  🏪 SEEDING STORES (Taco Bell RD)                  │');
  console.log('└────────────────────────────────────────────────────┘');

  // Buscar la company Taco Bell RD
  const tacoBellRD = await companyRepo.findOne({
    where: { subdomain: 'republica' },
  });

  if (!tacoBellRD) {
    console.log('  ⚠ Company "Taco Bell Republica Dominicana" no encontrada. Saltando stores.');
    return;
  }

  // Cache de geo_city_ids para evitar queries repetidas
  const cityIdCache: Record<string, string | null> = {};

  let created = 0;
  let updated = 0;

  for (const storeDef of STORE_DEFINITIONS) {
    const existingStore = await storeRepo.findOne({
      where: { codigo: storeDef.codigo },
    });

    // Resolver geo_city_id (con cache)
    if (!(storeDef.ciudad in cityIdCache)) {
      cityIdCache[storeDef.ciudad] = await findGeoCityId(cityRepo, storeDef.ciudad);
    }
    const geoCityId = cityIdCache[storeDef.ciudad];

    const storePayload = {
      company_id: tacoBellRD.id,
      nombre: storeDef.nombre,
      codigo: storeDef.codigo,
      direccion: storeDef.direccion,
      ciudad: storeDef.ciudad,
      email: storeDef.email,
      telefono: storeDef.telefono,
      zona: storeDef.zona,
      latitud: storeDef.latitud,
      longitud: storeDef.longitud,
      region: storeDef.region,
      location_type: storeDef.location_type,
      store_format: storeDef.store_format,
      seating_capacity: storeDef.seating_capacity,
      sales_tier: storeDef.sales_tier,
      has_drive_thru: storeDef.has_drive_thru,
      has_delivery: storeDef.has_delivery,
      operating_hours: storeDef.operating_hours,
      opening_date: storeDef.opening_date,
      manager_name: storeDef.manager_name,
      tags: storeDef.tags,
      activo: storeDef.activo,
      metadata: storeDef.metadata,
      ...(geoCityId ? { geo_city_id: geoCityId } : {}),
    };

    if (existingStore) {
      await storeRepo.save(
        storeRepo.create({
          id: existingStore.id,
          ...storePayload,
        }),
      );
      updated++;
      const cityLabel = geoCityId ? 'OK geo' : 'WARN sin geo';
      console.log(`  [UPDATE] Store "${storeDef.codigo}" actualizada (${cityLabel})`);
      continue;
    }

    const store = storeRepo.create(storePayload);
    await storeRepo.save(store);
    created++;

    const cityLabel = geoCityId ? 'OK geo' : 'WARN sin geo';
    console.log(`  [CREATE] Store "${storeDef.codigo}" creada (${cityLabel})`);
  }

  // Resumen
  const totalStores = await storeRepo.count();
  console.log('\n  📊 Resumen:');
  console.log(`     Creadas: ${created}`);
  console.log(`     Actualizadas: ${updated}`);
  console.log(`     Total en BD: ${totalStores}`);
  console.log('\n  ✅ Stores seeded successfully');
}


