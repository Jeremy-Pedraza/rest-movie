export enum ROLES {
  ADMINISTRADOR = 'administrador',
  ESTUDIANTE = 'estudiante',
  DOCENTE = 'docente',
  COLABORADOR = 'colaborador',
  PUBLICO = 'publico',
}

export const DEFAULT_ROLES: { name: string; description: string }[] = [
  { name: ROLES.ADMINISTRADOR, description: 'Acceso completo al sistema' },
  { name: ROLES.ESTUDIANTE, description: 'Acceso de estudiante' },
  { name: ROLES.DOCENTE, description: 'Acceso de docente' },
  { name: ROLES.COLABORADOR, description: 'Acceso de colaborador' },
  { name: ROLES.PUBLICO, description: 'Acceso publico limitado' },
];
