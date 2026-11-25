export const ROLE_CODES = [
  "owner",
  "administration",
  "production",
  "finance",
  "commercial",
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export const CAPABILITIES = [
  "clients.read",
  "clients.write",
  "calendar.read",
  "calendar.write",
  "projects.read",
  "projects.write",
  "finance.read",
  "finance.write",
  "packages.read",
  "packages.write",
  "quotes.manage",
  "portfolio.manage",
  "site.manage",
  "users.manage",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const allCapabilities = new Set<Capability>(CAPABILITIES);

export const ROLE_CAPABILITIES: Record<RoleCode, readonly Capability[]> = {
  owner: CAPABILITIES,
  administration: [
    "clients.read",
    "clients.write",
    "calendar.read",
    "calendar.write",
    "projects.read",
    "projects.write",
    "packages.read",
    "quotes.manage",
    "site.manage",
  ],
  production: [
    "calendar.read",
    "projects.read",
    "projects.write",
    "packages.read",
  ],
  finance: [
    "clients.read",
    "finance.read",
    "finance.write",
    "quotes.manage",
  ],
  commercial: [
    "clients.read",
    "clients.write",
    "calendar.read",
    "packages.read",
    "quotes.manage",
    "portfolio.manage",
  ],
};

export function isRoleCode(value: string): value is RoleCode {
  return ROLE_CODES.includes(value as RoleCode);
}

export function isCapability(value: string): value is Capability {
  return allCapabilities.has(value as Capability);
}

export function capabilitiesForRole(role: RoleCode): readonly Capability[] {
  return ROLE_CAPABILITIES[role];
}

export function hasCapability(
  capabilities: readonly Capability[],
  required: Capability,
) {
  return capabilities.includes(required);
}

export function canAccessUserRecord(
  viewerUserId: string,
  targetUserId: string,
  capabilities: readonly Capability[],
) {
  return viewerUserId === targetUserId || hasCapability(capabilities, "users.manage");
}

export const ROLE_LABELS: Record<RoleCode, string> = {
  owner: "Propietario",
  administration: "Administración",
  production: "Producción",
  finance: "Finanzas",
  commercial: "Comercial",
};
