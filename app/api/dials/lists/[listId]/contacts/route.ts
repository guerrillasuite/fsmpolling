// app/api/dials/list/[listId]/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/init';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ listId: string }> }
) {
  const { listId } = await context.params;
  const db = getDatabase();
  
  try {
    // Get dial list info including survey
    const list = db.prepare(`
      SELECT id, name, survey_id
      FROM dial_lists
      WHERE id = ? AND active = 1
    `).get(listId) as any;
    
    if (!list) {
      return NextResponse.json(
        { error: 'Dial list not found' },
        { status: 404 }
      );
    }
    
    // Get contacts in this list that haven't been completed
    const contacts = db.prepare(`
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.phone,
        c.email,
        dlc.status,
        dlc.call_result,
        dlc.called_at
      FROM contacts c
      JOIN dial_list_contacts dlc ON c.id = dlc.contact_id
      WHERE dlc.list_id = ?
        AND dlc.status IN ('pending', 'no_answer')
      ORDER BY dlc.created_at ASC
    `).all(listId) as any[];
    
    return NextResponse.json({
      list_id: list.id,
      list_name: list.name,
      survey_id: list.survey_id,
      contacts
    });
    
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}