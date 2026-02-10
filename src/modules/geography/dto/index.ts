// src/modules/geography/dto/index.ts

/**
 * Barrel export para DTOs del módulo Geography
 */

export {
  QueryCountriesDto,
  QueryDepartmentsDto,
  QueryCitiesDto,
  SearchGeographyDto,
} from './query-geography.dto';

export {
  CountryResponseDto,
  DepartmentResponseDto,
  CityResponseDto,
  GeographySearchResultDto,
  CountriesListResponseDto,
  DepartmentsListResponseDto,
  CitiesListResponseDto,
  GeographySearchResponseDto,
} from './geography-response.dto';
