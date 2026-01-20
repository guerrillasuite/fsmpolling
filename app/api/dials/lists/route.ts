// app/api/dials/lists/route.ts
import { NextResponse } from 'next/server';
import { getCiviCRMClient } from '@/lib/civicrm/client';

export async function GET() {
  try {
    const client = getCiviCRMClient();

    // Fetch all groups from CiviCRM
    const groupsResponse = await client['apiCall']('Group', 'get', {
      sequential: 1,
      is_active: 1,
      options: { limit: 0 } // Get all groups
    });

    if (!groupsResponse.values || !Array.isArray(groupsResponse.values)) {
      return NextResponse.json({ lists: [] });
    }

    // For each group, get the contact count
    const listsPromises = groupsResponse.values.map(async (group: any) => {
      try {
        const contactsResponse = await client['apiCall']('Contact', 'get', {
          group: group.id,
          sequential: 1,
          return: ['id'],
          options: { limit: 0 }
        });

        const totalContacts = contactsResponse.count || 0;

        return {
          id: String(group.id),
          name: group.title || group.name,
          description: group.description || '',
          survey_id: null, // Can be set up later if needed
          survey_title: null,
          total_contacts: totalContacts,
          pending_contacts: totalContacts, // Initially all pending
          completed_contacts: 0
        };
      } catch (err) {
        console.error(`Error fetching contacts for group ${group.id}:`, err);
        return {
          id: String(group.id),
          name: group.title || group.name,
          description: group.description || '',
          survey_id: null,
          survey_title: null,
          total_contacts: 0,
          pending_contacts: 0,
          completed_contacts: 0
        };
      }
    });

    const lists = await Promise.all(listsPromises);

    return NextResponse.json({ lists });

  } catch (error) {
    console.error('Error fetching dial lists from CiviCRM:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dial lists' },
      { status: 500 }
    );
  }
}