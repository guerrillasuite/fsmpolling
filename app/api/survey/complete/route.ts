// app/api/survey/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/init';
import { pushPollToCiviCRM, getContactInfoFromResponses } from '@/lib/civicrm/poll-sync';

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

    // Check if session exists
    const existing = db.prepare(`
      SELECT id, completed_at
      FROM survey_sessions
      WHERE crm_contact_id = ? AND survey_id = ?
    `).get(crm_contact_id, survey_id) as any;

    if (!existing) {
      // Session doesn't exist, create it now
      db.prepare(`
        INSERT INTO survey_sessions (crm_contact_id, survey_id, completed_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).run(crm_contact_id, survey_id);
    } else if (existing.completed_at) {
      // Already completed - this should be caught by the frontend now
      return NextResponse.json(
        { error: 'Survey already completed' },
        { status: 400 }
      );
    } else {
      // Mark as completed
      db.prepare(`
        UPDATE survey_sessions
        SET completed_at = CURRENT_TIMESTAMP
        WHERE crm_contact_id = ? AND survey_id = ?
      `).run(crm_contact_id, survey_id);
    }

    // ===== CIVICRM INTEGRATION =====
    // Push responses to CiviCRM after marking as complete
    try {
      // Get contact info from the contact verification question
      const contactInfo = getContactInfoFromResponses(crm_contact_id, survey_id);

      // Push to CiviCRM
      await pushPollToCiviCRM(crm_contact_id, survey_id, contactInfo || undefined);

      console.log(`✓ Successfully synced poll to CiviCRM for contact ${crm_contact_id}`);
    } catch (civiError) {
      // Log the error but don't fail the request
      // The poll is still marked complete in local DB
      console.error('Failed to sync to CiviCRM (poll still saved locally):', civiError);

      // Optionally, you could return a warning to the frontend
      return NextResponse.json({
        success: true,
        message: 'Survey completed successfully',
        warning: 'Survey saved locally but CiviCRM sync failed. Contact administrator.'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Survey completed successfully'
    });
  } catch (error) {
    console.error('Error completing survey:', error);
    return NextResponse.json(
      { error: 'Failed to complete survey' },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}
