import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ loggedIn: false }, { status: 200 });
    }

    try {
      const decoded = JSON.parse(Buffer.from(session, 'base64').toString('utf-8'));
      return NextResponse.json({ loggedIn: true, user: decoded });
    } catch (e) {
      return NextResponse.json({ loggedIn: false }, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { loggedIn: false, error: 'Error al verificar sesión: ' + error.message },
      { status: 500 }
    );
  }
}
