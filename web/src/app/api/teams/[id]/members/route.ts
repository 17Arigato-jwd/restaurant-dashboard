import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/teams/:id/members — list members of a specific team
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = db.getTeam(id);

  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  const members = db.getTeamMembers(id);
  const roles = db.getRoles();

  const populated = members.map(m => ({
    ...m,
    role: roles.find(r => r.id === m.roleId),
  }));

  return NextResponse.json(populated);
}
