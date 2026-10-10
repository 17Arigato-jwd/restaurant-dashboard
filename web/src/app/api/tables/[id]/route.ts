import { forward } from '@/lib/backend';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forward(req, `/api/tables/${id}`);
}
