// scripts/check-responses.ts
import { getDatabase } from '../lib/db/init';

const db = getDatabase();

console.log('📊 Recent Survey Completions:\n');

// Get recent sessions
const sessions = db.prepare(`
  SELECT
    crm_contact_id,
    started_at,
    completed_at,
    last_question_answered
  FROM survey_sessions
  WHERE survey_id = 'lnc-chair-2025'
  ORDER BY started_at DESC
  LIMIT 5
`).all();

if (sessions.length === 0) {
  console.log('No survey sessions found.');
} else {
  sessions.forEach((session: any) => {
    console.log(`Contact ID: ${session.crm_contact_id}`);
    console.log(`  Started: ${session.started_at}`);
    console.log(`  Completed: ${session.completed_at || 'Not completed'}`);
    console.log(`  Last Question: ${session.last_question_answered || 'None'}`);

    // Get responses for this contact
    const responses = db.prepare(`
      SELECT question_id, answer_value, answer_text
      FROM responses
      WHERE crm_contact_id = ? AND survey_id = 'lnc-chair-2025'
    `).all(session.crm_contact_id);

    console.log(`  Responses: ${responses.length}`);
    if (responses.length > 0) {
      responses.forEach((r: any, i: number) => {
        const preview = r.answer_value.length > 50
          ? r.answer_value.substring(0, 50) + '...'
          : r.answer_value;
        console.log(`    ${i + 1}. ${r.question_id}: ${preview}`);
      });
    }
    console.log('');
  });
}

db.close();
