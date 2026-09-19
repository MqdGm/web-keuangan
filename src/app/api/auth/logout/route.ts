import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/db';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await deleteSession(token);
    }

    // Expire cookie
    cookieStore.set(SESSION_COOKIE_NAME, '', {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil keluar.',
    });
  } catch (error: any) {
    console.error('[API Logout] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat logout.' },
      { status: 500 }
    );
  }
}
