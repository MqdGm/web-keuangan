import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail, createSession } from '@/lib/db';
import { verifyPassword, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Email atau kata sandi tidak sesuai.' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email atau kata sandi tidak sesuai.' },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(user.id);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.token, SESSION_COOKIE_OPTIONS);

    return NextResponse.json({
      success: true,
      message: 'Masuk berhasil!',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        currency: user.currency,
      },
    });
  } catch (error: any) {
    console.error('[API Login] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat memproses login.' },
      { status: 500 }
    );
  }
}
