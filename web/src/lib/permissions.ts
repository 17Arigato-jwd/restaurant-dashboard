/**
 * Central role/authorization rules. Lower role levels are more privileged
 * (1 = Owner, 2 = Store Manager, 3 = Cashier, 4 = Janitor, 5+ = custom).
 */

/** Maximum (least privileged) level allowed to open a given route. */
export const PAGE_MAX_LEVEL: Record<string, number> = {
  '/restaurant-settings': 2,
  '/reconciliation': 2,
  '/audit-logs': 2,
  '/menu-engineering': 2,
  '/pos-comparison': 2,
  '/inventory': 3,
  '/delivery': 3,
};

/** Returns the maximum role level allowed on a path (undefined = unrestricted). */
export function maxLevelForPath(pathname: string): number | undefined {
  if (PAGE_MAX_LEVEL[pathname] !== undefined) return PAGE_MAX_LEVEL[pathname];
  const match = Object.keys(PAGE_MAX_LEVEL).find((path) => pathname.startsWith(`${path}/`));
  return match ? PAGE_MAX_LEVEL[match] : undefined;
}

/** Extracts the current user's numeric role level, or null when unknown. */
export function roleLevelOf(
  user: { role?: { level?: number } } | null | undefined,
): number | null {
  const level = user?.role?.level;
  return typeof level === 'number' ? level : null;
}

/**
 * Whether a user at `currentLevel` may edit/delete an account at `targetLevel`.
 * Only strictly lower-level accounts can be managed; unknown roles are not blocked.
 */
export function canManageLevel(currentLevel: number | null, targetLevel: number | null): boolean {
  if (currentLevel == null) return true;
  if (targetLevel == null) return false;
  return currentLevel < targetLevel;
}
