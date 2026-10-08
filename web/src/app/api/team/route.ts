import { forward } from '@/lib/backend';

// GET  /api/team -> list users in the caller's restaurant
// POST /api/team -> create a team member (returns a temporary password)
export async function GET(req: Request) {
  return forward(req, '/api/users');
}

export async function POST(req: Request) {
  return forward(req, '/api/users');
}
