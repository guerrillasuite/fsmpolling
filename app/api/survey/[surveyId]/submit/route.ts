// app/api/survey/[surveyId]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/init';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ surveyId: string }> }
) {
  const { surveyId } = await context.params;
  const body = await request.json();
  const { contactId, answers } = body;
  
  console.log('Survey submission:', { surveyId, contactId, answers });
  
  if (!contactId || !answers) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }
  
  const db = getDatabase();
  
  try {
    // Start transaction
    db.exec('BEGIN TRANSACTION');

    try {
      // Create or update session
      db.prepare(`
        INSERT INTO survey_sessions (crm_contact_id, survey_id, started_at, completed_at)
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(crm_contact_id, survey_id)
        DO UPDATE SET completed_at = CURRENT_TIMESTAMP
      `).run(contactId, surveyId);

      // Delete any existing responses for this contact/survey (in case of retake)
      db.prepare(`
        DELETE FROM responses
        WHERE crm_contact_id = ? AND survey_id = ?
      `).run(contactId, surveyId);

      // Insert new responses
      const insertResponse = db.prepare(`
        INSERT INTO responses (
          crm_contact_id,
          survey_id,
          question_id,
          answer_value,
          answer_text,
          original_position
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const [questionId, answer] of Object.entries(answers)) {
        const answerData = answer as any;
        insertResponse.run(
          contactId,
          surveyId,
          questionId,
          answerData.value || answerData,
          answerData.text || null,
          answerData.originalPosition || null
        );
      }

      // Commit transaction
      db.exec('COMMIT');
    } catch (error) {
      // Rollback on any error
      db.exec('ROLLBACK');
      throw error;
    }
    
    console.log('Survey submitted successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Survey submitted successfully'
    });
    
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    console.error('Error submitting survey:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to submit survey',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}