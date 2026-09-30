import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(db.getRoles());
}

export async function POST(req: Request) {
  const body = await req.json();
  
  // Only admins can create roles (Level 1 or 2)
  const executorRoleId = req.headers.get('X-User-Role-Id');
  if (executorRoleId) {
    const roles = db.getRoles();
    const executorRole = roles.find(r => r.id === executorRoleId);
    if (!executorRole || executorRole.level > 2) {
      return NextResponse.json({ error: 'Unauthorized: Only admins/managers can create roles' }, { status: 403 });
    }
  }

  const newRole = db.addRole({
    id: `r${Date.now()}`,
    name: body.name,
    level: body.level || 5,
    canEditLevelsAbove: body.level || 5
  });
  
  return NextResponse.json(newRole, { status: 201 });
}
