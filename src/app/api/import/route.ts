import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Berkas JSON kosong atau tidak valid' }, { status: 400 });
    }

    if (!Array.isArray(body.accounts) || !Array.isArray(body.transactions)) {
      return NextResponse.json(
        { success: false, error: 'Format berkas tidak sesuai: kolom accounts dan transactions wajib ada.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: {
        accounts: body.accounts.length,
        transactions: body.transactions.length,
        categories: body.categories?.length || 0,
        budgets: body.budgets?.length || 0,
        savingsGoals: body.savings_goals?.length || 0,
        debts: body.debts?.length || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Gagal memproses data impor' }, { status: 500 });
  }
}
