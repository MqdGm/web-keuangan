import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.nextUrl.origin}/api/google/callback`;

  if (!clientId) {
    return NextResponse.json({
      configured: false,
      message: 'GOOGLE_CLIENT_ID belum diatur di file .env.local',
      setupGuide: {
        step1: 'Buka Google Cloud Console (console.cloud.google.com)',
        step2: 'Buat project baru dan aktifkan Google Sheets API dan Google Drive API',
        step3: 'Buat OAuth 2.0 Client ID (Web Application)',
        step4: `Tambahkan Authorized redirect URI: ${redirectUri}`,
        step5: 'Masukkan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di file .env.local',
      },
    });
  }

  // Generate OAuth URL
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;

  return NextResponse.json({
    configured: true,
    authUrl,
  });
}
