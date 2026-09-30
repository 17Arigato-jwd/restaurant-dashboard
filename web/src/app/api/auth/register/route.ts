import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Create a new Owner account by default when registering from the login page
    const newUser = db.addUser({
      id: `u${Date.now()}`,
      name: email.split('@')[0], // Generate a temporary name
      email: email,
      roleId: 'r1', // Owner role
      status: 'active',
      avatarUrl: ''
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error during registration' }, { status: 500 });
  }
}
