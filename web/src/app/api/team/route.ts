import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const users = db.getUsers();
  const roles = db.getRoles();
  
  // Join users with their roles for the frontend
  const populatedUsers = users.map(user => ({
    ...user,
    role: roles.find(r => r.id === user.roleId)
  }));
  
  return NextResponse.json(populatedUsers);
}

export async function POST(req: Request) {
  const body = await req.json();
  const newUser = db.addUser({
    id: `u${Date.now()}`,
    name: body.name || 'New User',
    email: body.email,
    roleId: body.roleId,
    status: 'active',
    avatarUrl: body.avatarUrl || ''
  });
  
  return NextResponse.json(newUser, { status: 201 });
}
