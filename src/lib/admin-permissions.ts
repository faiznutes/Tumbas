type AdminSessionUser = {
  role?: string;
  permissions?: string[];
  email?: string;
  id?: string;
  name?: string | null;
};

export const ADMIN_SESSION_UPDATED_EVENT = "admin-session-updated";

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    "orders.view",
    "orders.edit",
    "products.edit",
    "products.categories.view",
    "products.categories.edit",
    "messages.view",
    "messages.edit",
    "settings.view",
    "settings.edit",
    "settings.general.view",
    "settings.general.edit",
    "settings.store.view",
    "settings.store.edit",
    "settings.notifications.view",
    "settings.notifications.edit",
    "settings.promo.view",
    "settings.promo.edit",
    "settings.weekly.view",
    "settings.weekly.edit",
    "settings.featured.view",
    "settings.featured.edit",
    "settings.payment.view",
    "settings.payment.edit",
    "settings.shipping.view",
    "settings.shipping.edit",
    "settings.notice.view",
  ],
  MANAGER: [],
};

function normalizePermissions(input: unknown): string[] {
  return Array.isArray(input) ? input.filter((item): item is string => typeof item === "string") : [];
}

function hasSettingsFallbackPermission(userPermissions: string[], requiredPermission: string) {
  if (!requiredPermission.startsWith("settings.")) return false;
  if (requiredPermission.endsWith(".view") && userPermissions.includes("settings.view")) return true;
  if (requiredPermission.endsWith(".edit") && userPermissions.includes("settings.edit")) return true;
  return false;
}

function hasProductCategoriesFallbackPermission(userPermissions: string[], requiredPermission: string) {
  if (!requiredPermission.startsWith("products.categories.")) return false;
  return userPermissions.includes("products.edit");
}

function getResolvedPermissions(user: AdminSessionUser): string[] {
  if (user.role === "SUPER_ADMIN") return ["*"];
  const explicit = normalizePermissions(user.permissions);
  if (explicit.length > 0) return explicit;
  return ROLE_DEFAULT_PERMISSIONS[user.role || ""] || [];
}

export function getCurrentAdminUser(): AdminSessionUser {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AdminSessionUser;
    return {
      role: parsed.role,
      permissions: normalizePermissions(parsed.permissions),
      id: typeof parsed.id === "string" ? parsed.id : undefined,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      name: typeof parsed.name === "string" || parsed.name === null ? parsed.name : undefined,
    };
  } catch {
    return {};
  }
}

export function setCurrentAdminUser(user: AdminSessionUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem("user");
  } else {
    localStorage.setItem("user", JSON.stringify(user));
  }
  window.dispatchEvent(new Event(ADMIN_SESSION_UPDATED_EVENT));
}

export function hasAdminPermission(permission: string) {
  const user = getCurrentAdminUser();
  if (user.role === "SUPER_ADMIN") return true;
  const userPermissions = getResolvedPermissions(user);
  return (
    userPermissions.includes(permission) ||
    hasSettingsFallbackPermission(userPermissions, permission) ||
    hasProductCategoriesFallbackPermission(userPermissions, permission)
  );
}

export function hasAnyAdminPermission(permissions: string[]) {
  return permissions.some((permission) => hasAdminPermission(permission));
}
