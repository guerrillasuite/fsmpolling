// app/api/dials/lists/route.ts
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/init';

export async function GET() {
  const db = getDatabase();
  
  try {
    const lists = db.prepare(`
      SELECT 
        dl.id,
        dl.name,
        dl.description,
        dl.survey_id,
        s.title as survey_title,
        COUNT(DISTINCT dlc.contact_id) as total_contacts,
        COUNT(DISTINCT CASE WHEN dlc.status = 'pending' THEN dlc.contact_id END) as pending_contacts,
        COUNT(DISTINCT CASE WHEN dlc.status = 'completed' THEN dlc.contact_id END) as completed_contacts
      FROM dial_lists dl
      LEFT JOIN dial_list_contacts dlc ON dl.id = dlc.list_id
      LEFT JOIN surveys s ON dl.survey_id = s.id
      WHERE dl.active = 1
      GROUP BY dl.id
      ORDER BY dl.created_at DESC
    `).all();
    
    return NextResponse.json({ lists });
    
  } catch (error) {
    console.error('Error fetching dial lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dial lists' },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}