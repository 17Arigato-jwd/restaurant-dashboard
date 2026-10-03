import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const teams = db.getTeams();

  // Enrich each team with member count and owner info
  const enriched = teams.map(team => ({
    ...team,
    memberCount: db.getTeamMembers(team.id).length,
    owner: db.getUser(team.ownerId),
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  const body = await req.json();

  const newTeam = db.addTeam({
    id: `team${Date.now()}`,
    name: body.name,
    description: body.description || '',
    createdAt: new Date().toISOString(),
    ownerId: body.ownerId || 'u1',
  });

  return NextResponse.json(newTeam, { status: 201 });
}
