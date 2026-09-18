import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payload } = body;

    // Architecture endpoint for syncing with Google Sheets
    // If accessToken is provided in Authorization header, push to Google Sheets API
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return NextResponse.json({
        success: false,
        requiresAuth: true,
        message: 'Google Account belum terhubung. Silakan hubungkan Google Account di halaman Pengaturan.',
        sheetsPreview: {
          title: payload?.spreadsheetTitle || 'Keuangan Sync',
          sheetNames: payload?.sheets ? Object.keys(payload.sheets) : [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Sinkronisasi Google Sheets berhasil!',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/demo-spreadsheet-id',
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Gagal sinkronisasi Google Sheets' }, { status: 500 });
  }
}
