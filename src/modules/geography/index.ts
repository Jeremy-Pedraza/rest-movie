// src/modules/geography/index.ts

/**
 * Barrel export para el módulo Geography
 */

export { GeographyModule } from './geography.module';
export { GeographyService } from './geography.service';
export { GeographyRepository } from './geography.repository';
export { GeographyController } from './geography.controller';

// Entidades
export { GeoCountryEntity, GeoDepartmentEntity, GeoCityEntity } from './entities';

// DTOs
export {
  QueryCountriesDto,
  QueryDepartmentsDto,
  QueryCitiesDto,
  SearchGeographyDto,
  CountryResponseDto,
  DepartmentResponseDto,
  CityResponseDto,
  GeographySearchResultDto,
  CountriesListResponseDto,
  DepartmentsListResponseDto,
  CitiesListResponseDto,
  GeographySearchResponseDto,
} from './dto';
