import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  // Basic RBAC check
  const executorRoleId = req.headers.get('X-User-Role-Id');
  if (executorRoleId) {
    const roles = db.getRoles();
    const executorRole = roles.find(r => r.id === executorRoleId);
    if (!executorRole || executorRole.level > 2) {
      return NextResponse.json({ error: 'Unauthorized: Only admins/managers can delete roles' }, { status: 403 });
    }
  }

  // Prevent deleting core roles (Level 1 and 2)
  const targetRole = db.getRoles().find(r => r.id === id);
  if (targetRole && targetRole.level <= 2) {
    return NextResponse.json({ error: 'Cannot delete core admin/manager roles' }, { status: 400 });
  }

  db.deleteRole(id);
  return new NextResponse(null, { status: 204 });
}
