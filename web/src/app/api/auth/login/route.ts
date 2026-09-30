import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    // Using simple mock logic: Password is not validated here since it's mock
    const user = db.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account is pending activation.' }, { status: 403 });
    }

    return NextResponse.json({
      token: `mock-token-${user.id}`,
      role: user.roleId,
      userId: user.id
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
