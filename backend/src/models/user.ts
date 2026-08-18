export type UserRole = "admin" | "user";
export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AdminUserView {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function toAdminUserView(user: User): AdminUserView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
  };
}
