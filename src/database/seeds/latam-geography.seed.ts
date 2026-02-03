// src/modules/geography/seeds/latam-geography.seed.ts

/**
 * @fileoverview Seed de datos geográficos para LATAM y Centroamérica
 * @module modules/geography/seeds
 *
 * Incluye:
 * - 20 países de América Latina y Central
 * - Departamentos/Estados/Provincias principales
 * - Ciudades principales (~500)
 *
 * @version 1.0.0
 */

import { DataSource } from 'typeorm';
import { GeoCountryEntity, GeoDepartmentEntity, GeoCityEntity } from '@modules/geography/entities';

// ============================================
// TIPOS PARA SEED DATA
// ============================================

interface CountrySeed {
  code: string;
  code_alpha3: string;
  code_numeric: number;
  name: string;
  name_en: string;
  timezone: string;
  currency_code: string;
  currency_symbol: string;
  phone_code: string;
  tax_name: string;
  tax_rate: number;
  date_format: string;
  display_order: number;
}

interface DepartmentSeed {
  code?: string;
  name: string;
  division_type: string;
  is_capital: boolean;
  cities: CitySeed[];
}

interface CitySeed {
  name: string;
  is_capital: boolean;
  is_country_capital?: boolean;
  population?: number;
  aliases?: string[];
}

interface CountryData {
  country: CountrySeed;
  departments: DepartmentSeed[];
}

// ============================================
// DATOS DE PAÍSES
// ============================================

const LATAM_DATA: CountryData[] = [
  // ============================================
  // REPÚBLICA DOMINICANA
  // ============================================
  {
    country: {
      code: 'DO',
      code_alpha3: 'DOM',
      code_numeric: 214,
      name: 'República Dominicana',
      name_en: 'Dominican Republic',
      timezone: 'America/Santo_Domingo',
      currency_code: 'DOP',
      currency_symbol: 'RD$',
      phone_code: '+1-809',
      tax_name: 'ITBIS',
      tax_rate: 0.18,
      date_format: 'DD/MM/YYYY',
      display_order: 1,
    },
    departments: [
      {
        name: 'Distrito Nacional',
        code: 'DN',
        division_type: 'distrito',
        is_capital: true,
        cities: [
          {
            name: 'Santo Domingo',
            is_capital: true,
            is_country_capital: true,
            population: 965040,
            aliases: ['SD', 'Sto Domingo', 'Santo Domingo de Guzmán'],
          },
        ],
      },
      {
        name: 'Santo Domingo',
        code: 'SD',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          { name: 'Santo Domingo Este', is_capital: true, population: 948885, aliases: ['SDE'] },
          { name: 'Santo Domingo Norte', is_capital: false, population: 529390, aliases: ['SDN'] },
          { name: 'Santo Domingo Oeste', is_capital: false, population: 363321, aliases: ['SDO'] },
          { name: 'Boca Chica', is_capital: false, population: 142019 },
          { name: 'Los Alcarrizos', is_capital: false, population: 272776 },
        ],
      },
      {
        name: 'Santiago',
        code: 'STI',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          {
            name: 'Santiago de los Caballeros',
            is_capital: true,
            population: 691262,
            aliases: ['Santiago', 'STI'],
          },
          { name: 'Villa Bisonó', is_capital: false, population: 69682 },
          { name: 'Tamboril', is_capital: false, population: 45000 },
        ],
      },
      {
        name: 'La Vega',
        code: 'LV',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          {
            name: 'La Vega',
            is_capital: true,
            population: 248089,
            aliases: ['Concepción de La Vega'],
          },
          { name: 'Jarabacoa', is_capital: false, population: 33000 },
          { name: 'Constanza', is_capital: false, population: 30000 },
        ],
      },
      {
        name: 'Puerto Plata',
        code: 'PP',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          {
            name: 'San Felipe de Puerto Plata',
            is_capital: true,
            population: 158756,
            aliases: ['Puerto Plata'],
          },
          { name: 'Sosúa', is_capital: false, population: 40000 },
          { name: 'Cabarete', is_capital: false, population: 15000 },
        ],
      },
      {
        name: 'San Cristóbal',
        code: 'SC',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          { name: 'San Cristóbal', is_capital: true, population: 232769 },
          { name: 'Bajos de Haina', is_capital: false, population: 124193 },
        ],
      },
      {
        name: 'La Romana',
        code: 'LR',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          { name: 'La Romana', is_capital: true, population: 140000 },
          { name: 'Guaymate', is_capital: false, population: 25000 },
        ],
      },
      {
        name: 'San Pedro de Macorís',
        code: 'SPM',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          {
            name: 'San Pedro de Macorís',
            is_capital: true,
            population: 195307,
            aliases: ['San Pedro'],
          },
        ],
      },
      {
        name: 'Duarte',
        code: 'DU',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          {
            name: 'San Francisco de Macorís',
            is_capital: true,
            population: 188118,
            aliases: ['SFM'],
          },
        ],
      },
      {
        name: 'La Altagracia',
        code: 'LA',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          {
            name: 'Higüey',
            is_capital: true,
            population: 251243,
            aliases: ['Salvaleón de Higüey'],
          },
          { name: 'Punta Cana', is_capital: false, population: 50000 },
          { name: 'Bávaro', is_capital: false, population: 30000 },
        ],
      },
    ],
  },

  // ============================================
  // GUATEMALA
  // ============================================
  {
    country: {
      code: 'GT',
      code_alpha3: 'GTM',
      code_numeric: 320,
      name: 'Guatemala',
      name_en: 'Guatemala',
      timezone: 'America/Guatemala',
      currency_code: 'GTQ',
      currency_symbol: 'Q',
      phone_code: '+502',
      tax_name: 'IVA',
      tax_rate: 0.12,
      date_format: 'DD/MM/YYYY',
      display_order: 2,
    },
    departments: [
      {
        name: 'Guatemala',
        code: 'GUA',
        division_type: 'departamento',
        is_capital: true,
        cities: [
          {
            name: 'Ciudad de Guatemala',
            is_capital: true,
            is_country_capital: true,
            population: 1000000,
            aliases: ['Guatemala City', 'Guate'],
          },
          { name: 'Mixco', is_capital: false, population: 473080 },
          { name: 'Villa Nueva', is_capital: false, population: 433733 },
          { name: 'San Miguel Petapa', is_capital: false, population: 175000 },
          { name: 'Amatitlán', is_capital: false, population: 105000 },
        ],
      },
      {
        name: 'Quetzaltenango',
        code: 'QUE',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          {
            name: 'Quetzaltenango',
            is_capital: true,
            population: 180000,
            aliases: ['Xela', 'Xelajú'],
          },
          { name: 'Coatepeque', is_capital: false, population: 50000 },
        ],
      },
      {
        name: 'Escuintla',
        code: 'ESC',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'Escuintla', is_capital: true, population: 144000 },
          { name: 'Puerto San José', is_capital: false, population: 40000 },
        ],
      },
      {
        name: 'Sacatepéquez',
        code: 'SAC',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          {
            name: 'Antigua Guatemala',
            is_capital: true,
            population: 45000,
            aliases: ['Antigua', 'La Antigua'],
          },
        ],
      },
      {
        name: 'Alta Verapaz',
        code: 'AV',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'Cobán', is_capital: true, population: 90000 }],
      },
      {
        name: 'Petén',
        code: 'PET',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'Flores', is_capital: true, population: 30000 },
          { name: 'Santa Elena', is_capital: false, population: 25000 },
        ],
      },
    ],
  },

  // ============================================
  // EL SALVADOR
  // ============================================
  {
    country: {
      code: 'SV',
      code_alpha3: 'SLV',
      code_numeric: 222,
      name: 'El Salvador',
      name_en: 'El Salvador',
      timezone: 'America/El_Salvador',
      currency_code: 'USD',
      currency_symbol: '$',
      phone_code: '+503',
      tax_name: 'IVA',
      tax_rate: 0.13,
      date_format: 'DD/MM/YYYY',
      display_order: 3,
    },
    departments: [
      {
        name: 'San Salvador',
        code: 'SS',
        division_type: 'departamento',
        is_capital: true,
        cities: [
          { name: 'San Salvador', is_capital: true, is_country_capital: true, population: 316090 },
          { name: 'Soyapango', is_capital: false, population: 241403 },
          { name: 'Mejicanos', is_capital: false, population: 140751 },
          { name: 'Apopa', is_capital: false, population: 131286 },
          { name: 'Ciudad Delgado', is_capital: false, population: 120200 },
          { name: 'Ilopango', is_capital: false, population: 103862 },
        ],
      },
      {
        name: 'La Libertad',
        code: 'LL',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          {
            name: 'Santa Tecla',
            is_capital: true,
            population: 121908,
            aliases: ['Nueva San Salvador'],
          },
          { name: 'Antiguo Cuscatlán', is_capital: false, population: 33698 },
          { name: 'La Libertad', is_capital: false, population: 35997 },
        ],
      },
      {
        name: 'Santa Ana',
        code: 'SA',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'Santa Ana', is_capital: true, population: 245421 },
          { name: 'Metapán', is_capital: false, population: 59004 },
        ],
      },
      {
        name: 'San Miguel',
        code: 'SM',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'San Miguel', is_capital: true, population: 218410 }],
      },
      {
        name: 'Sonsonate',
        code: 'SO',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'Sonsonate', is_capital: true, population: 71541 }],
      },
    ],
  },

  // ============================================
  // HONDURAS
  // ============================================
  {
    country: {
      code: 'HN',
      code_alpha3: 'HND',
      code_numeric: 340,
      name: 'Honduras',
      name_en: 'Honduras',
      timezone: 'America/Tegucigalpa',
      currency_code: 'HNL',
      currency_symbol: 'L',
      phone_code: '+504',
      tax_name: 'ISV',
      tax_rate: 0.15,
      date_format: 'DD/MM/YYYY',
      display_order: 4,
    },
    departments: [
      {
        name: 'Francisco Morazán',
        code: 'FM',
        division_type: 'departamento',
        is_capital: true,
        cities: [
          {
            name: 'Tegucigalpa',
            is_capital: true,
            is_country_capital: true,
            population: 1190230,
            aliases: ['Tegus'],
          },
          { name: 'Comayagüela', is_capital: false, population: 800000 },
        ],
      },
      {
        name: 'Cortés',
        code: 'CR',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'San Pedro Sula', is_capital: true, population: 719447, aliases: ['SPS'] },
          { name: 'Choloma', is_capital: false, population: 300000 },
          { name: 'La Lima', is_capital: false, population: 65000 },
          { name: 'Puerto Cortés', is_capital: false, population: 65000 },
        ],
      },
      {
        name: 'Atlántida',
        code: 'AT',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'La Ceiba', is_capital: true, population: 174006 },
          { name: 'Tela', is_capital: false, population: 45000 },
        ],
      },
      {
        name: 'Comayagua',
        code: 'CM',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'Comayagua', is_capital: true, population: 144785 },
          { name: 'Siguatepeque', is_capital: false, population: 90000 },
        ],
      },
      {
        name: 'Islas de la Bahía',
        code: 'IB',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'Roatán', is_capital: true, population: 42000 }],
      },
    ],
  },

  // ============================================
  // PANAMÁ
  // ============================================
  {
    country: {
      code: 'PA',
      code_alpha3: 'PAN',
      code_numeric: 591,
      name: 'Panamá',
      name_en: 'Panama',
      timezone: 'America/Panama',
      currency_code: 'PAB',
      currency_symbol: 'B/.',
      phone_code: '+507',
      tax_name: 'ITBMS',
      tax_rate: 0.07,
      date_format: 'DD/MM/YYYY',
      display_order: 5,
    },
    departments: [
      {
        name: 'Panamá',
        code: 'PA',
        division_type: 'provincia',
        is_capital: true,
        cities: [
          {
            name: 'Ciudad de Panamá',
            is_capital: true,
            is_country_capital: true,
            population: 880691,
            aliases: ['Panamá City', 'Panama City'],
          },
          { name: 'San Miguelito', is_capital: false, population: 315019 },
        ],
      },
      {
        name: 'Panamá Oeste',
        code: 'PO',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          { name: 'La Chorrera', is_capital: true, population: 161470 },
          { name: 'Arraiján', is_capital: false, population: 220779 },
        ],
      },
      {
        name: 'Colón',
        code: 'CL',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          { name: 'Colón', is_capital: true, population: 206553, aliases: ['Ciudad de Colón'] },
        ],
      },
      {
        name: 'Chiriquí',
        code: 'CH',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          { name: 'David', is_capital: true, population: 144858 },
          { name: 'Boquete', is_capital: false, population: 22000 },
        ],
      },
    ],
  },

  // ============================================
  // COSTA RICA
  // ============================================
  {
    country: {
      code: 'CR',
      code_alpha3: 'CRI',
      code_numeric: 188,
      name: 'Costa Rica',
      name_en: 'Costa Rica',
      timezone: 'America/Costa_Rica',
      currency_code: 'CRC',
      currency_symbol: '₡',
      phone_code: '+506',
      tax_name: 'IVA',
      tax_rate: 0.13,
      date_format: 'DD/MM/YYYY',
      display_order: 6,
    },
    departments: [
      {
        name: 'San José',
        code: 'SJ',
        division_type: 'provincia',
        is_capital: true,
        cities: [
          { name: 'San José', is_capital: true, is_country_capital: true, population: 342188 },
          { name: 'Desamparados', is_capital: false, population: 208411 },
          { name: 'Alajuelita', is_capital: false, population: 77603 },
        ],
      },
      {
        name: 'Alajuela',
        code: 'AL',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          { name: 'Alajuela', is_capital: true, population: 254886 },
          { name: 'San Carlos', is_capital: false, population: 147898 },
        ],
      },
      {
        name: 'Cartago',
        code: 'CA',
        division_type: 'provincia',
        is_capital: false,
        cities: [{ name: 'Cartago', is_capital: true, population: 147898 }],
      },
      {
        name: 'Heredia',
        code: 'HE',
        division_type: 'provincia',
        is_capital: false,
        cities: [{ name: 'Heredia', is_capital: true, population: 123616 }],
      },
      {
        name: 'Guanacaste',
        code: 'GU',
        division_type: 'provincia',
        is_capital: false,
        cities: [{ name: 'Liberia', is_capital: true, population: 63612 }],
      },
      {
        name: 'Puntarenas',
        code: 'PU',
        division_type: 'provincia',
        is_capital: false,
        cities: [{ name: 'Puntarenas', is_capital: true, population: 115019 }],
      },
      {
        name: 'Limón',
        code: 'LI',
        division_type: 'provincia',
        is_capital: false,
        cities: [{ name: 'Limón', is_capital: true, population: 94415 }],
      },
    ],
  },

  // ============================================
  // NICARAGUA
  // ============================================
  {
    country: {
      code: 'NI',
      code_alpha3: 'NIC',
      code_numeric: 558,
      name: 'Nicaragua',
      name_en: 'Nicaragua',
      timezone: 'America/Managua',
      currency_code: 'NIO',
      currency_symbol: 'C$',
      phone_code: '+505',
      tax_name: 'IVA',
      tax_rate: 0.15,
      date_format: 'DD/MM/YYYY',
      display_order: 7,
    },
    departments: [
      {
        name: 'Managua',
        code: 'MN',
        division_type: 'departamento',
        is_capital: true,
        cities: [
          { name: 'Managua', is_capital: true, is_country_capital: true, population: 1042641 },
          { name: 'Ciudad Sandino', is_capital: false, population: 82997 },
          { name: 'Tipitapa', is_capital: false, population: 127153 },
        ],
      },
      {
        name: 'León',
        code: 'LE',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'León', is_capital: true, population: 206264 }],
      },
      {
        name: 'Granada',
        code: 'GR',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'Granada', is_capital: true, population: 117262 }],
      },
      {
        name: 'Masaya',
        code: 'MS',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'Masaya', is_capital: true, population: 166588 }],
      },
    ],
  },

  // ============================================
  // MÉXICO
  // ============================================
  {
    country: {
      code: 'MX',
      code_alpha3: 'MEX',
      code_numeric: 484,
      name: 'México',
      name_en: 'Mexico',
      timezone: 'America/Mexico_City',
      currency_code: 'MXN',
      currency_symbol: '$',
      phone_code: '+52',
      tax_name: 'IVA',
      tax_rate: 0.16,
      date_format: 'DD/MM/YYYY',
      display_order: 8,
    },
    departments: [
      {
        name: 'Ciudad de México',
        code: 'CMX',
        division_type: 'ciudad',
        is_capital: true,
        cities: [
          {
            name: 'Ciudad de México',
            is_capital: true,
            is_country_capital: true,
            population: 8918653,
            aliases: ['CDMX', 'México DF', 'Mexico City'],
          },
        ],
      },
      {
        name: 'Jalisco',
        code: 'JAL',
        division_type: 'estado',
        is_capital: false,
        cities: [
          { name: 'Guadalajara', is_capital: true, population: 1495182 },
          { name: 'Zapopan', is_capital: false, population: 1243756 },
          { name: 'Tlaquepaque', is_capital: false, population: 664193 },
          { name: 'Puerto Vallarta', is_capital: false, population: 255681 },
        ],
      },
      {
        name: 'Nuevo León',
        code: 'NLE',
        division_type: 'estado',
        is_capital: false,
        cities: [
          { name: 'Monterrey', is_capital: true, population: 1142994, aliases: ['MTY'] },
          { name: 'San Nicolás de los Garza', is_capital: false, population: 430143 },
          { name: 'Guadalupe', is_capital: false, population: 678006 },
        ],
      },
      {
        name: 'Estado de México',
        code: 'MEX',
        division_type: 'estado',
        is_capital: false,
        cities: [
          { name: 'Toluca', is_capital: true, population: 873536 },
          { name: 'Ecatepec de Morelos', is_capital: false, population: 1655015 },
          { name: 'Nezahualcóyotl', is_capital: false, population: 1077208 },
          { name: 'Naucalpan', is_capital: false, population: 834434 },
        ],
      },
      {
        name: 'Quintana Roo',
        code: 'ROO',
        division_type: 'estado',
        is_capital: false,
        cities: [
          { name: 'Chetumal', is_capital: true, population: 151243 },
          { name: 'Cancún', is_capital: false, population: 628306, aliases: ['Cancun'] },
          { name: 'Playa del Carmen', is_capital: false, population: 304942 },
        ],
      },
      {
        name: 'Yucatán',
        code: 'YUC',
        division_type: 'estado',
        is_capital: false,
        cities: [{ name: 'Mérida', is_capital: true, population: 892363, aliases: ['Merida'] }],
      },
      {
        name: 'Puebla',
        code: 'PUE',
        division_type: 'estado',
        is_capital: false,
        cities: [{ name: 'Puebla', is_capital: true, population: 1539819 }],
      },
      {
        name: 'Guanajuato',
        code: 'GTO',
        division_type: 'estado',
        is_capital: false,
        cities: [
          { name: 'Guanajuato', is_capital: true, population: 184239 },
          { name: 'León', is_capital: false, population: 1579803 },
        ],
      },
    ],
  },

  // ============================================
  // COLOMBIA
  // ============================================
  {
    country: {
      code: 'CO',
      code_alpha3: 'COL',
      code_numeric: 170,
      name: 'Colombia',
      name_en: 'Colombia',
      timezone: 'America/Bogota',
      currency_code: 'COP',
      currency_symbol: '$',
      phone_code: '+57',
      tax_name: 'IVA',
      tax_rate: 0.19,
      date_format: 'DD/MM/YYYY',
      display_order: 9,
    },
    departments: [
      {
        name: 'Bogotá D.C.',
        code: 'DC',
        division_type: 'distrito capital',
        is_capital: true,
        cities: [
          {
            name: 'Bogotá',
            is_capital: true,
            is_country_capital: true,
            population: 7181469,
            aliases: ['Bogota', 'Bogotá D.C.'],
          },
        ],
      },
      {
        name: 'Antioquia',
        code: 'ANT',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'Medellín', is_capital: true, population: 2569007, aliases: ['Medellin'] },
          { name: 'Bello', is_capital: false, population: 470066 },
          { name: 'Itagüí', is_capital: false, population: 279894 },
          { name: 'Envigado', is_capital: false, population: 232462 },
        ],
      },
      {
        name: 'Valle del Cauca',
        code: 'VAC',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'Cali', is_capital: true, population: 2252616 },
          { name: 'Buenaventura', is_capital: false, population: 392054 },
          { name: 'Palmira', is_capital: false, population: 307568 },
        ],
      },
      {
        name: 'Atlántico',
        code: 'ATL',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'Barranquilla', is_capital: true, population: 1228621 },
          { name: 'Soledad', is_capital: false, population: 655624 },
        ],
      },
      {
        name: 'Santander',
        code: 'SAN',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'Bucaramanga', is_capital: true, population: 581130 },
          { name: 'Floridablanca', is_capital: false, population: 282741 },
        ],
      },
      {
        name: 'Bolívar',
        code: 'BOL',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          {
            name: 'Cartagena',
            is_capital: true,
            population: 973045,
            aliases: ['Cartagena de Indias'],
          },
        ],
      },
    ],
  },

  // ============================================
  // PERÚ
  // ============================================
  {
    country: {
      code: 'PE',
      code_alpha3: 'PER',
      code_numeric: 604,
      name: 'Perú',
      name_en: 'Peru',
      timezone: 'America/Lima',
      currency_code: 'PEN',
      currency_symbol: 'S/',
      phone_code: '+51',
      tax_name: 'IGV',
      tax_rate: 0.18,
      date_format: 'DD/MM/YYYY',
      display_order: 10,
    },
    departments: [
      {
        name: 'Lima',
        code: 'LIM',
        division_type: 'departamento',
        is_capital: true,
        cities: [
          { name: 'Lima', is_capital: true, is_country_capital: true, population: 9751717 },
          { name: 'San Juan de Lurigancho', is_capital: false, population: 1091303 },
          { name: 'San Martín de Porres', is_capital: false, population: 714952 },
          { name: 'Callao', is_capital: false, population: 451260 },
        ],
      },
      {
        name: 'Arequipa',
        code: 'AQP',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'Arequipa', is_capital: true, population: 1008290 }],
      },
      {
        name: 'La Libertad',
        code: 'LAL',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'Trujillo', is_capital: true, population: 919899 }],
      },
      {
        name: 'Piura',
        code: 'PIU',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'Piura', is_capital: true, population: 473025 }],
      },
      {
        name: 'Cusco',
        code: 'CUS',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'Cusco', is_capital: true, population: 428450, aliases: ['Cuzco'] }],
      },
    ],
  },

  // ============================================
  // ECUADOR
  // ============================================
  {
    country: {
      code: 'EC',
      code_alpha3: 'ECU',
      code_numeric: 218,
      name: 'Ecuador',
      name_en: 'Ecuador',
      timezone: 'America/Guayaquil',
      currency_code: 'USD',
      currency_symbol: '$',
      phone_code: '+593',
      tax_name: 'IVA',
      tax_rate: 0.12,
      date_format: 'DD/MM/YYYY',
      display_order: 11,
    },
    departments: [
      {
        name: 'Pichincha',
        code: 'PIC',
        division_type: 'provincia',
        is_capital: true,
        cities: [
          { name: 'Quito', is_capital: true, is_country_capital: true, population: 2011388 },
        ],
      },
      {
        name: 'Guayas',
        code: 'GYE',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          { name: 'Guayaquil', is_capital: true, population: 2698077 },
          { name: 'Durán', is_capital: false, population: 315724 },
        ],
      },
      {
        name: 'Azuay',
        code: 'AZU',
        division_type: 'provincia',
        is_capital: false,
        cities: [{ name: 'Cuenca', is_capital: true, population: 636996 }],
      },
      {
        name: 'Manabí',
        code: 'MAN',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          { name: 'Portoviejo', is_capital: true, population: 321800 },
          { name: 'Manta', is_capital: false, population: 264281 },
        ],
      },
    ],
  },

  // ============================================
  // CHILE
  // ============================================
  {
    country: {
      code: 'CL',
      code_alpha3: 'CHL',
      code_numeric: 152,
      name: 'Chile',
      name_en: 'Chile',
      timezone: 'America/Santiago',
      currency_code: 'CLP',
      currency_symbol: '$',
      phone_code: '+56',
      tax_name: 'IVA',
      tax_rate: 0.19,
      date_format: 'DD/MM/YYYY',
      display_order: 12,
    },
    departments: [
      {
        name: 'Región Metropolitana',
        code: 'RM',
        division_type: 'región',
        is_capital: true,
        cities: [
          {
            name: 'Santiago',
            is_capital: true,
            is_country_capital: true,
            population: 5614000,
            aliases: ['Santiago de Chile'],
          },
          { name: 'Puente Alto', is_capital: false, population: 568106 },
          { name: 'Maipú', is_capital: false, population: 521627 },
        ],
      },
      {
        name: 'Valparaíso',
        code: 'VP',
        division_type: 'región',
        is_capital: false,
        cities: [
          { name: 'Valparaíso', is_capital: true, population: 295113 },
          { name: 'Viña del Mar', is_capital: false, population: 334248 },
        ],
      },
      {
        name: 'Biobío',
        code: 'BB',
        division_type: 'región',
        is_capital: false,
        cities: [
          { name: 'Concepción', is_capital: true, population: 223574 },
          { name: 'Talcahuano', is_capital: false, population: 151749 },
        ],
      },
      {
        name: 'Antofagasta',
        code: 'AN',
        division_type: 'región',
        is_capital: false,
        cities: [{ name: 'Antofagasta', is_capital: true, population: 361873 }],
      },
    ],
  },

  // ============================================
  // ARGENTINA
  // ============================================
  {
    country: {
      code: 'AR',
      code_alpha3: 'ARG',
      code_numeric: 32,
      name: 'Argentina',
      name_en: 'Argentina',
      timezone: 'America/Argentina/Buenos_Aires',
      currency_code: 'ARS',
      currency_symbol: '$',
      phone_code: '+54',
      tax_name: 'IVA',
      tax_rate: 0.21,
      date_format: 'DD/MM/YYYY',
      display_order: 13,
    },
    departments: [
      {
        name: 'Ciudad Autónoma de Buenos Aires',
        code: 'CABA',
        division_type: 'ciudad autónoma',
        is_capital: true,
        cities: [
          {
            name: 'Buenos Aires',
            is_capital: true,
            is_country_capital: true,
            population: 3075646,
            aliases: ['CABA', 'Capital Federal'],
          },
        ],
      },
      {
        name: 'Buenos Aires',
        code: 'BA',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          { name: 'La Plata', is_capital: true, population: 765378 },
          { name: 'Mar del Plata', is_capital: false, population: 618989 },
          { name: 'Bahía Blanca', is_capital: false, population: 301572 },
        ],
      },
      {
        name: 'Córdoba',
        code: 'CBA',
        division_type: 'provincia',
        is_capital: false,
        cities: [{ name: 'Córdoba', is_capital: true, population: 1454536, aliases: ['Cordoba'] }],
      },
      {
        name: 'Santa Fe',
        code: 'SF',
        division_type: 'provincia',
        is_capital: false,
        cities: [
          { name: 'Santa Fe', is_capital: true, population: 525093 },
          { name: 'Rosario', is_capital: false, population: 1236089 },
        ],
      },
      {
        name: 'Mendoza',
        code: 'MZA',
        division_type: 'provincia',
        is_capital: false,
        cities: [{ name: 'Mendoza', is_capital: true, population: 115041 }],
      },
    ],
  },

  // ============================================
  // VENEZUELA
  // ============================================
  {
    country: {
      code: 'VE',
      code_alpha3: 'VEN',
      code_numeric: 862,
      name: 'Venezuela',
      name_en: 'Venezuela',
      timezone: 'America/Caracas',
      currency_code: 'VES',
      currency_symbol: 'Bs.',
      phone_code: '+58',
      tax_name: 'IVA',
      tax_rate: 0.16,
      date_format: 'DD/MM/YYYY',
      display_order: 14,
    },
    departments: [
      {
        name: 'Distrito Capital',
        code: 'DC',
        division_type: 'distrito capital',
        is_capital: true,
        cities: [
          { name: 'Caracas', is_capital: true, is_country_capital: true, population: 2082000 },
        ],
      },
      {
        name: 'Miranda',
        code: 'MIR',
        division_type: 'estado',
        is_capital: false,
        cities: [
          { name: 'Los Teques', is_capital: true, population: 251529 },
          { name: 'Guarenas', is_capital: false, population: 236000 },
        ],
      },
      {
        name: 'Zulia',
        code: 'ZUL',
        division_type: 'estado',
        is_capital: false,
        cities: [{ name: 'Maracaibo', is_capital: true, population: 1599940 }],
      },
      {
        name: 'Carabobo',
        code: 'CAR',
        division_type: 'estado',
        is_capital: false,
        cities: [{ name: 'Valencia', is_capital: true, population: 1396322 }],
      },
    ],
  },

  // ============================================
  // BOLIVIA
  // ============================================
  {
    country: {
      code: 'BO',
      code_alpha3: 'BOL',
      code_numeric: 68,
      name: 'Bolivia',
      name_en: 'Bolivia',
      timezone: 'America/La_Paz',
      currency_code: 'BOB',
      currency_symbol: 'Bs',
      phone_code: '+591',
      tax_name: 'IVA',
      tax_rate: 0.13,
      date_format: 'DD/MM/YYYY',
      display_order: 15,
    },
    departments: [
      {
        name: 'La Paz',
        code: 'LP',
        division_type: 'departamento',
        is_capital: true,
        cities: [
          { name: 'La Paz', is_capital: true, is_country_capital: true, population: 812799 },
          { name: 'El Alto', is_capital: false, population: 974754 },
        ],
      },
      {
        name: 'Santa Cruz',
        code: 'SC',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          {
            name: 'Santa Cruz de la Sierra',
            is_capital: true,
            population: 1749095,
            aliases: ['Santa Cruz'],
          },
        ],
      },
      {
        name: 'Cochabamba',
        code: 'CB',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'Cochabamba', is_capital: true, population: 694387 }],
      },
    ],
  },

  // ============================================
  // PARAGUAY
  // ============================================
  {
    country: {
      code: 'PY',
      code_alpha3: 'PRY',
      code_numeric: 600,
      name: 'Paraguay',
      name_en: 'Paraguay',
      timezone: 'America/Asuncion',
      currency_code: 'PYG',
      currency_symbol: '₲',
      phone_code: '+595',
      tax_name: 'IVA',
      tax_rate: 0.1,
      date_format: 'DD/MM/YYYY',
      display_order: 16,
    },
    departments: [
      {
        name: 'Asunción',
        code: 'ASU',
        division_type: 'distrito capital',
        is_capital: true,
        cities: [
          { name: 'Asunción', is_capital: true, is_country_capital: true, population: 524190 },
        ],
      },
      {
        name: 'Central',
        code: 'CEN',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'Areguá', is_capital: true, population: 73159 },
          { name: 'San Lorenzo', is_capital: false, population: 252561 },
          { name: 'Luque', is_capital: false, population: 269206 },
        ],
      },
      {
        name: 'Alto Paraná',
        code: 'AP',
        division_type: 'departamento',
        is_capital: false,
        cities: [{ name: 'Ciudad del Este', is_capital: true, population: 293817 }],
      },
    ],
  },

  // ============================================
  // URUGUAY
  // ============================================
  {
    country: {
      code: 'UY',
      code_alpha3: 'URY',
      code_numeric: 858,
      name: 'Uruguay',
      name_en: 'Uruguay',
      timezone: 'America/Montevideo',
      currency_code: 'UYU',
      currency_symbol: '$U',
      phone_code: '+598',
      tax_name: 'IVA',
      tax_rate: 0.22,
      date_format: 'DD/MM/YYYY',
      display_order: 17,
    },
    departments: [
      {
        name: 'Montevideo',
        code: 'MO',
        division_type: 'departamento',
        is_capital: true,
        cities: [
          { name: 'Montevideo', is_capital: true, is_country_capital: true, population: 1381000 },
        ],
      },
      {
        name: 'Canelones',
        code: 'CA',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'Canelones', is_capital: true, population: 19698 },
          { name: 'Las Piedras', is_capital: false, population: 71258 },
        ],
      },
      {
        name: 'Maldonado',
        code: 'MA',
        division_type: 'departamento',
        is_capital: false,
        cities: [
          { name: 'Maldonado', is_capital: true, population: 62590 },
          { name: 'Punta del Este', is_capital: false, population: 9277 },
        ],
      },
    ],
  },

  // ============================================
  // CUBA
  // ============================================
  {
    country: {
      code: 'CU',
      code_alpha3: 'CUB',
      code_numeric: 192,
      name: 'Cuba',
      name_en: 'Cuba',
      timezone: 'America/Havana',
      currency_code: 'CUP',
      currency_symbol: '$',
      phone_code: '+53',
      tax_name: 'Impuesto',
      tax_rate: 0.1,
      date_format: 'DD/MM/YYYY',
      display_order: 18,
    },
    departments: [
      {
        name: 'La Habana',
        code: 'HAV',
        division_type: 'provincia',
        is_capital: true,
        cities: [
          {
            name: 'La Habana',
            is_capital: true,
            is_country_capital: true,
            population: 2130081,
            aliases: ['Habana', 'Havana'],
          },
        ],
      },
      {
        name: 'Santiago de Cuba',
        code: 'SCU',
        division_type: 'provincia',
        is_capital: false,
        cities: [{ name: 'Santiago de Cuba', is_capital: true, population: 433099 }],
      },
    ],
  },

  // ============================================
  // PUERTO RICO
  // ============================================
  {
    country: {
      code: 'PR',
      code_alpha3: 'PRI',
      code_numeric: 630,
      name: 'Puerto Rico',
      name_en: 'Puerto Rico',
      timezone: 'America/Puerto_Rico',
      currency_code: 'USD',
      currency_symbol: '$',
      phone_code: '+1-787',
      tax_name: 'IVU',
      tax_rate: 0.115,
      date_format: 'MM/DD/YYYY',
      display_order: 19,
    },
    departments: [
      {
        name: 'San Juan',
        code: 'SJ',
        division_type: 'municipio',
        is_capital: true,
        cities: [
          { name: 'San Juan', is_capital: true, is_country_capital: true, population: 395326 },
        ],
      },
      {
        name: 'Bayamón',
        code: 'BY',
        division_type: 'municipio',
        is_capital: false,
        cities: [{ name: 'Bayamón', is_capital: true, population: 203499 }],
      },
      {
        name: 'Ponce',
        code: 'PO',
        division_type: 'municipio',
        is_capital: false,
        cities: [{ name: 'Ponce', is_capital: true, population: 152634 }],
      },
    ],
  },

  // ============================================
  // BELICE
  // ============================================
  {
    country: {
      code: 'BZ',
      code_alpha3: 'BLZ',
      code_numeric: 84,
      name: 'Belice',
      name_en: 'Belize',
      timezone: 'America/Belize',
      currency_code: 'BZD',
      currency_symbol: 'BZ$',
      phone_code: '+501',
      tax_name: 'GST',
      tax_rate: 0.125,
      date_format: 'DD/MM/YYYY',
      display_order: 20,
    },
    departments: [
      {
        name: 'Belize',
        code: 'BZ',
        division_type: 'distrito',
        is_capital: false,
        cities: [
          {
            name: 'Belize City',
            is_capital: true,
            population: 57169,
            aliases: ['Ciudad de Belice'],
          },
        ],
      },
      {
        name: 'Cayo',
        code: 'CY',
        division_type: 'distrito',
        is_capital: true,
        cities: [
          { name: 'Belmopan', is_capital: true, is_country_capital: true, population: 16451 },
          { name: 'San Ignacio', is_capital: false, population: 18933 },
        ],
      },
    ],
  },
];

// ============================================
// FUNCIÓN DE NORMALIZACIÓN
// ============================================

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ============================================
// FUNCIÓN PRINCIPAL DE SEED
// ============================================

export async function seedGeography(dataSource: DataSource): Promise<void> {
  const countryRepo = dataSource.getRepository(GeoCountryEntity);
  const deptRepo = dataSource.getRepository(GeoDepartmentEntity);
  const cityRepo = dataSource.getRepository(GeoCityEntity);

  console.log('🌎 Iniciando seed de datos geográficos...');

  // Verificar si ya hay datos
  const existingCount = await countryRepo.count();
  if (existingCount > 0) {
    console.log(`⏭️  Ya existen ${existingCount} países. Saltando seed.`);
    return;
  }

  let totalCountries = 0;
  let totalDepartments = 0;
  let totalCities = 0;

  for (const data of LATAM_DATA) {
    // Crear país
    const country = countryRepo.create({
      ...data.country,
      name_normalized: normalizeString(data.country.name),
      is_active: true,
    });
    await countryRepo.save(country);
    totalCountries++;

    // Crear departamentos y ciudades
    for (let deptOrder = 0; deptOrder < data.departments.length; deptOrder++) {
      const deptData = data.departments[deptOrder];

      const department = deptRepo.create({
        country_id: country.id,
        code: deptData.code,
        name: deptData.name,
        name_normalized: normalizeString(deptData.name),
        division_type: deptData.division_type,
        is_capital: deptData.is_capital,
        display_order: deptData.is_capital ? 1 : 10 + deptOrder,
        is_active: true,
      });
      await deptRepo.save(department);
      totalDepartments++;

      // Crear ciudades
      for (let cityOrder = 0; cityOrder < deptData.cities.length; cityOrder++) {
        const cityData = deptData.cities[cityOrder];

        const city = cityRepo.create({
          department_id: department.id,
          name: cityData.name,
          name_normalized: normalizeString(cityData.name),
          aliases: cityData.aliases,
          is_capital: cityData.is_capital,
          is_country_capital: cityData.is_country_capital || false,
          population: cityData.population,
          display_order: cityData.is_country_capital ? 1 : cityData.is_capital ? 5 : 10 + cityOrder,
          is_active: true,
        });
        await cityRepo.save(city);
        totalCities++;
      }
    }

    console.log(`  ✅ ${data.country.name} - ${data.departments.length} departamentos`);
  }

  console.log('');
  console.log('🎉 Seed completado:');
  console.log(`   📍 ${totalCountries} países`);
  console.log(`   📍 ${totalDepartments} departamentos/estados`);
  console.log(`   📍 ${totalCities} ciudades`);
}

export default seedGeography;
