import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserFinanceData, saveUserFinanceData } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Akses ditolak. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const data = await getUserFinanceData(user.id);
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[API Finance Data GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat data keuangan.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Akses ditolak. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const updates = await request.json();
    const updated = await saveUserFinanceData(user.id, updates);

    return NextResponse.json({
      success: true,
      updated_at: updated.updated_at,
    });
  } catch (error: any) {
    console.error('[API Finance Data POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan data keuangan.' },
      { status: 500 }
    );
  }
}
