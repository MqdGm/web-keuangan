import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Belum masuk (unauthorized).' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        currency: user.currency,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    console.error('[API Auth Me] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem.' },
      { status: 500 }
    );
  }
}
