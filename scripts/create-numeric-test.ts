import { getDatabase } from '../lib/db/init';

const db = getDatabase();

// Copy test-user-1 responses to contact ID "5" (numeric)
const responses = db.prepare(`
  SELECT question_id, survey_id, answer_value, answer_text, original_position
  FROM responses
  WHERE crm_contact_id = 'test-user-1'
`).all();

const insertResponse = db.prepare(`
  INSERT OR REPLACE INTO responses (crm_contact_id, survey_id, question_id, answer_value, answer_text, original_position)
  VALUES (?, ?, ?, ?, ?, ?)
`);

responses.forEach((r: any) => {
  insertResponse.run('5', r.survey_id, r.question_id, r.answer_value, r.answer_text, r.original_position);
});

// Create session
db.prepare(`
  INSERT OR REPLACE INTO survey_sessions (crm_contact_id, survey_id, completed_at)
  VALUES ('5', 'lnc-chair-2025', CURRENT_TIMESTAMP)
`).run();

console.log('✅ Created test data for numeric contact ID "5"');
console.log(`   Copied ${responses.length} responses from test-user-1`);
db.close();
