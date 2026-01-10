export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  GUEST: 'guest',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export const ROLES_HIERARCHY = {
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER, ROLES.GUEST],
  [ROLES.MANAGER]: [ROLES.MANAGER, ROLES.USER, ROLES.GUEST],
  [ROLES.USER]: [ROLES.USER, ROLES.GUEST],
  [ROLES.GUEST]: [ROLES.GUEST],
} as const;
