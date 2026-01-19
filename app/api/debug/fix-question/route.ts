// Temporary debug route to fix question options
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/init';

export async function GET() {
  const db = getDatabase();

  try {
    // Check current options for the first question
    const question = db.prepare(`
      SELECT id, question_text, options
      FROM questions
      WHERE id = 'lnc-chair-q1'
    `).get() as any;

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const currentOptions = JSON.parse(question.options);
    const correctOptions = ['Evan McMahon', 'Rob Yates', 'Wes Benedict', 'Jim Ostrowski', 'Undecided'];

    // Update the options
    db.prepare(`
      UPDATE questions
      SET options = ?
      WHERE id = 'lnc-chair-q1'
    `).run(JSON.stringify(correctOptions));

    // Verify the update
    const updatedQuestion = db.prepare(`
      SELECT id, question_text, options
      FROM questions
      WHERE id = 'lnc-chair-q1'
    `).get() as any;

    return NextResponse.json({
      message: 'Question options updated',
      before: currentOptions,
      after: JSON.parse(updatedQuestion.options)
    });
  } catch (error) {
    console.error('Error fixing question:', error);
    return NextResponse.json(
      { error: 'Failed to fix question options', details: String(error) },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}
