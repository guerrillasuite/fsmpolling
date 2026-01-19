// app/api/survey/session-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/init';

export async function POST(request: NextRequest) {
  const db = getDatabase();

  try {
    const body = await request.json();
    const { crm_contact_id, survey_id } = body;

    if (!crm_contact_id || !survey_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if session exists and if it's completed
    const session = db.prepare(`
      SELECT id, completed_at
      FROM survey_sessions
      WHERE crm_contact_id = ? AND survey_id = ?
    `).get(crm_contact_id, survey_id) as any;

    return NextResponse.json({
      exists: !!session,
      completed: !!session?.completed_at
    });
  } catch (error) {
    console.error('Error checking session status:', error);
    return NextResponse.json(
      { error: 'Failed to check session status' },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}
