// app/api/surveys/list/route.ts
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/init';

export async function GET() {
  const db = getDatabase();

  try {
    const surveys = db.prepare(`
      SELECT id, title, description, active
      FROM surveys
      WHERE active = 1
      ORDER BY created_at DESC
    `).all();

    return NextResponse.json({ surveys });

  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}
