import { forward } from '@/lib/backend';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return forward(req, `/api/users/${id}/password`);
}
