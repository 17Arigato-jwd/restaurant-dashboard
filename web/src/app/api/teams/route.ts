import { forward } from '@/lib/backend';

export async function GET(req: Request) {
  return forward(req, '/api/teams');
}

export async function POST(req: Request) {
  return forward(req, '/api/teams');
}
