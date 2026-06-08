import { NextRequest, NextResponse } from 'next/server';
import { signIn, signUp, signOut, getSession } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { action, email, password, fullName } = await req.json();
  switch (action) {
    case 'signup': {
      const { user, error } = await signUp(email, password, fullName);
      if (error) return NextResponse.json({ error }, { status: 400 });
      return NextResponse.json({ user: { id: user?.id, email: user?.email } });
    }
    case 'signin': {
      const { user, session, error } = await signIn(email, password);
      if (error) return NextResponse.json({ error }, { status: 401 });
      return NextResponse.json({ user: { id: user?.id, email: user?.email }, session });
    }
    case 'signout': {
      await signOut();
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: session.user.id, email: session.user.email } });
}
