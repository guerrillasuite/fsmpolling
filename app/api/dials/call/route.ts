// app/api/dials/call/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/init';
import { pushPollToCiviCRM, getContactInfoFromResponses } from '@/lib/civicrm/poll-sync';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { contactId, listId, surveyId, result, notes, answers } = body;

  const db = getDatabase();

  try {
    // Start transaction for local DB
    db.exec('BEGIN TRANSACTION');

    // Simple call log without foreign key constraints
    // We're just logging the activity, contact doesn't need to exist in our DB
    db.prepare(`
      INSERT INTO call_logs (contact_id, list_id, survey_id, result, notes, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(contactId, listId, surveyId || null, result, notes || null);

    // If survey was completed, save responses locally AND to CiviCRM
    if (answers && surveyId) {
      // Create or update session locally
      db.prepare(`
        INSERT INTO survey_sessions (crm_contact_id, survey_id, started_at, completed_at)
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(crm_contact_id, survey_id)
        DO UPDATE SET completed_at = CURRENT_TIMESTAMP
      `).run(contactId, surveyId);

      // Save each answer locally
      const insertResponse = db.prepare(`
        INSERT INTO responses (crm_contact_id, survey_id, question_id, answer_value, answer_text)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const [questionId, answer] of Object.entries(answers)) {
        const ans = answer as any;
        insertResponse.run(
          contactId,
          surveyId,
          questionId,
          ans.value,
          ans.text || null
        );
      }

      // === CiviCRM Integration ===
      // Use the same sync function as regular survey completion
      try {
        // Get contact info from the contact verification question
        const contactInfo = getContactInfoFromResponses(contactId, surveyId);

        // Push to CiviCRM using existing working function
        await pushPollToCiviCRM(contactId, surveyId, contactInfo || undefined);

        console.log(`✓ Successfully synced poll to CiviCRM for contact ${contactId}`);
      } catch (civiError) {
        // Log CiviCRM errors but don't fail the whole request
        console.error('CiviCRM integration error (non-fatal):', civiError);
        console.error('Local data was still saved successfully');
      }
    }

    db.exec('COMMIT');

    return NextResponse.json({ success: true });

  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Error saving call:', error);
    return NextResponse.json(
      { error: 'Failed to save call' },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}
