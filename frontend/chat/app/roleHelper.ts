// app/roleHelper.ts
export type UserRole = "admin" | "user";

export const ROLES = {
  ADMIN: "admin" as UserRole,
  USER: "user" as UserRole,
};

export const getUserRole = (user: any): UserRole | null => {
  if (!user) return null;
  
  // Check public metadata first (preferred)
  const role = 
    user?.publicMetadata?.role ||
    user?.unsafeMetadata?.role ||
    user?.metadata?.role ||
    null;
    
  return role;
};

export const hasRole = (user: any, requiredRole: UserRole): boolean => {
  const userRole = getUserRole(user);
  return userRole === requiredRole;
};

export const canAccessDashboard = (user: any): boolean => {
  return hasRole(user, ROLES.ADMIN);
};

export const canAccessHome = (user: any): boolean => {
  return hasRole(user, ROLES.USER);
};
