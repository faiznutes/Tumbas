type AdminSessionUser = {
  role?: string;
  permissions?: string[];
};

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    "orders.view",
    "orders.edit",
    "products.edit",
    "messages.view",
    "messages.edit",
    "settings.view",
    "settings.edit",
    "reports.view",
  ],
  MANAGER: [
    "orders.view",
    "orders.edit",
    "products.edit",
    "messages.view",
    "messages.edit",
    "settings.view",
    "settings.edit",
    "reports.view",
  ],
};

export function getCurrentAdminUser(): AdminSessionUser {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AdminSessionUser;
    return {
      role: parsed.role,
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
    };
  } catch {
    return {};
  }
}

export function hasAdminPermission(permission: string) {
  const user = getCurrentAdminUser();
  if (user.role === "SUPER_ADMIN") return true;
  const userPermissions = (user.permissions && user.permissions.length > 0)
    ? user.permissions
    : ROLE_DEFAULT_PERMISSIONS[user.role || ""] || [];
  return userPermissions.includes(permission);
}
