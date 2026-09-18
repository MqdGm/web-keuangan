import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (!data) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 });
    }

    if (type === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="keuangan_export_${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Export payload generated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Export error' }, { status: 500 });
  }
}
