import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const body = await req.json();
  
  // Basic RBAC check (simulated based on headers)
  const executorRoleId = req.headers.get('X-User-Role-Id');
  if (executorRoleId) {
    const roles = db.getRoles();
    const executorRole = roles.find(r => r.id === executorRoleId);
    const targetUser = db.getUser(id);
    const targetRole = targetUser ? roles.find(r => r.id === targetUser.roleId) : null;
    
    if (executorRole && targetRole) {
      if (executorRole.level > targetRole.level) {
        return NextResponse.json({ error: 'Unauthorized: Cannot edit a user with a higher role' }, { status: 403 });
      }
    }
  }

  const updatedUser = db.updateUser(id, body);
  if (!updatedUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  return NextResponse.json(updatedUser);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const executorRoleId = req.headers.get('X-User-Role-Id');
  if (executorRoleId) {
    const roles = db.getRoles();
    const executorRole = roles.find(r => r.id === executorRoleId);
    const targetUser = db.getUser(id);
    const targetRole = targetUser ? roles.find(r => r.id === targetUser.roleId) : null;
    
    if (executorRole && targetRole && executorRole.level > targetRole.level) {
      return NextResponse.json({ error: 'Unauthorized: Cannot delete a user with a higher role' }, { status: 403 });
    }
  }

  db.deleteUser(id);
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = db.getUser(resolvedParams.id);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}
