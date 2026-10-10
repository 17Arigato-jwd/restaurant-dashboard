import { forward } from '@/lib/backend';

export async function GET(req: Request) {
  return forward(req, '/api/tables');
}
