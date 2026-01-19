// app/api/dials/call/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/init';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { contactId, listId, surveyId, result, notes, answers } = body;
  
  const db = getDatabase();
  
  try {
    // Start transaction
    db.exec('BEGIN TRANSACTION');
    
    // Log the call
    db.prepare(`
      INSERT INTO call_logs (contact_id, list_id, survey_id, result, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(contactId, listId, surveyId, result, notes);
    
    // Update dial list contact status
    const status = result === 'Completed' ? 'completed' : 
                   result === 'No Answer' ? 'no_answer' : 
                   result === 'Do Not Call' ? 'dnc' : 'attempted';
    
    db.prepare(`
      UPDATE dial_list_contacts
      SET status = ?, call_result = ?, called_at = CURRENT_TIMESTAMP
      WHERE list_id = ? AND contact_id = ?
    `).run(status, result, listId, contactId);
    
    // If survey was completed, save responses
    if (answers && surveyId) {
      // Create or update session
      db.prepare(`
        INSERT INTO survey_sessions (crm_contact_id, survey_id, started_at, completed_at)
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(crm_contact_id, survey_id) 
        DO UPDATE SET completed_at = CURRENT_TIMESTAMP
      `).run(contactId, surveyId);
      
      // Save each answer
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