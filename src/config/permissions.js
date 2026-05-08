// Roles disponibles en el sistema
export const ROLES = {
  ROOT:  'ROOT',
  ADMIN: 'ADMIN',
};

// Mapa central de permisos → roles que los tienen
// Para agregar un nuevo rol: definirlo en ROLES y agregarlo a los permisos que correspondan
export const PERMISSIONS = {
  // Proyectos
  MANAGE_PROJECTS:       [ROLES.ROOT, ROLES.ADMIN],

  // Documentos
  MANAGE_DOCUMENTS:      [ROLES.ROOT, ROLES.ADMIN],

  // Chat / consultas
  USE_CHAT:              [ROLES.ROOT, ROLES.ADMIN],

  // Integraciones
  VIEW_INTEGRATIONS:     [ROLES.ROOT, ROLES.ADMIN],

  // Usuarios y Settings — solo ROOT
  VIEW_USERS:            [ROLES.ROOT],
  INVITE_USERS:          [ROLES.ROOT],
  VIEW_SETTINGS:         [ROLES.ROOT],
};

// Helper puro — no depende de React, usable en cualquier lugar
export const hasPermission = (role, permission) =>
  PERMISSIONS[permission]?.includes(role) ?? false;
