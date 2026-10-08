import { forward } from '@/lib/backend';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return forward(req, `/api/teams/${id}/members`);
}
