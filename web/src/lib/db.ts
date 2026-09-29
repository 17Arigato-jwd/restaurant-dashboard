export type RoleLevel = number; // Lower is more powerful (1 = Owner)

export interface Role {
  id: string;
  name: string;
  level: RoleLevel;
  canEditLevelsAbove: RoleLevel; // E.g., a Manager (Level 2) can edit users with Level > 2
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  avatarUrl?: string;
  status: 'active' | 'pending';
}

let roles: Role[] = [
  { id: 'r1', name: 'Owner', level: 1, canEditLevelsAbove: 1 },
  { id: 'r2', name: 'Store Manager', level: 2, canEditLevelsAbove: 2 },
  { id: 'r3', name: 'Cashier', level: 3, canEditLevelsAbove: 999 },
  { id: 'r4', name: 'Janitor', level: 4, canEditLevelsAbove: 999 },
];

let users: User[] = [
  { id: 'u1', name: 'Restaurant Admin', email: 'admin@restaurant.com', roleId: 'r1', status: 'active', avatarUrl: '' },
  { id: 'u2', name: 'Store Manager', email: 'manager@restaurant.com', roleId: 'r2', status: 'active', avatarUrl: '' },
  { id: 'u3', name: 'Waiting for invite', email: 'accountant@restaurant.com', roleId: 'r3', status: 'pending', avatarUrl: '' },
];

export const db = {
  getRoles: () => [...roles],
  addRole: (role: Role) => { roles.push(role); return role; },
  deleteRole: (id: string) => { roles = roles.filter(r => r.id !== id); },
  
  getUsers: () => [...users],
  getUser: (id: string) => users.find(u => u.id === id),
  addUser: (user: User) => { users.push(user); return user; },
  updateUser: (id: string, updates: Partial<User>) => {
    users = users.map(u => u.id === id ? { ...u, ...updates } : u);
    return users.find(u => u.id === id);
  },
  deleteUser: (id: string) => { users = users.filter(u => u.id !== id); }
};
