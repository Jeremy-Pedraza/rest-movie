export enum ROLES {
  ADMINISTRADOR = 'administrador',
  ESTUDIANTE = 'estudiante',
  DOCENTE = 'docente',
  COLABORADOR = 'colaborador',
  PUBLICO = 'publico',
}

export const DEFAULT_ROLES: { name: string; description: string; isActive: boolean }[] = [
  { name: ROLES.ADMINISTRADOR, description: 'Acceso completo al sistema', isActive: true },
  { name: ROLES.ESTUDIANTE, description: 'Acceso de estudiante', isActive: true },
  { name: ROLES.DOCENTE, description: 'Acceso de docente', isActive: true },
  { name: ROLES.COLABORADOR, description: 'Acceso de colaborador', isActive: true },
  { name: ROLES.PUBLICO, description: 'Acceso publico limitado', isActive: true },
];
