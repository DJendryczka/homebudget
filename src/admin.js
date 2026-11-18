export const SUPER_ADMIN_EMAIL = "dariusz.jendryczka@gmail.com";

export function isSuperAdmin(user) {
  return (user?.email || "").toLowerCase() === SUPER_ADMIN_EMAIL;
}
