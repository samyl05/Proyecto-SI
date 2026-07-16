import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = verifySessionToken(cookieStore.get('session')?.value);

    if (!user) {
      return NextResponse.json({ loggedIn: false }, { status: 200 });
    }

    return NextResponse.json({ loggedIn: true, user });
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    return NextResponse.json(
      { loggedIn: false, error: 'No se pudo verificar la sesión' },
      { status: 500 }
    );
  }
}
