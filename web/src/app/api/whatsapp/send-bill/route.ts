import { forward } from '@/lib/backend';

export async function POST(req: Request) {
  return forward(req, '/api/whatsapp/send-bill');
}
