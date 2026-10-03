import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = db.getTeam(id);

  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  const members = db.getTeamMembers(id);
  const roles = db.getRoles();

  const populatedMembers = members.map(m => ({
    ...m,
    role: roles.find(r => r.id === m.roleId),
  }));

  return NextResponse.json({
    ...team,
    memberCount: members.length,
    owner: db.getUser(team.ownerId),
    members: populatedMembers,
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const updated = db.updateTeam(id, body);
  if (!updated) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = db.getTeam(id);

  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // Prevent deleting a team that still has members
  const members = db.getTeamMembers(id);
  if (members.length > 0) {
    return NextResponse.json(
      { error: 'Cannot delete a team that still has members. Reassign or remove members first.' },
      { status: 400 }
    );
  }

  db.deleteTeam(id);
  return new NextResponse(null, { status: 204 });
}
