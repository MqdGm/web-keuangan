import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail, createUser, createSession, getUserFinanceData } from '@/lib/db';
import { hashPassword, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email tidak valid.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Kata sandi minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const trimmedName = (fullName && typeof fullName === 'string' ? fullName : email.split('@')[0]).trim();

    // Check if email already registered
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.' },
        { status: 409 }
      );
    }

    // Hash password
    const { hash, salt } = hashPassword(password);

    // Create user
    const newUser = await createUser({
      email,
      password_hash: hash,
      salt,
      full_name: trimmedName,
      currency: 'IDR',
    });

    // Inisialisasi data keuangan awal untuk user baru
    await getUserFinanceData(newUser.id);

    // Create session
    const session = await createSession(newUser.id);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.token, SESSION_COOKIE_OPTIONS);

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil!',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        currency: newUser.currency,
      },
    });
  } catch (error: any) {
    console.error('[API Register] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat memproses pendaftaran.' },
      { status: 500 }
    );
  }
}
