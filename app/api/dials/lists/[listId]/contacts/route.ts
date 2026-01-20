// app/api/dials/list/[listId]/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCiviCRMClient } from '@/lib/civicrm/client';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ listId: string }> }
) {
  const { listId } = await context.params;

  try {
    const client = getCiviCRMClient();

    // Get the group info
    const groupResponse = await client['apiCall']('Group', 'get', {
      id: listId,
      sequential: 1,
    });

    if (!groupResponse.values || !Array.isArray(groupResponse.values) || groupResponse.values.length === 0) {
      return NextResponse.json(
        { error: 'Dial list not found' },
        { status: 404 }
      );
    }

    const group = groupResponse.values[0];

    // Get all contacts in this group with their details
    const contactsResponse = await client['apiCall']('Contact', 'get', {
      group: listId,
      sequential: 1,
      return: ['id', 'first_name', 'last_name', 'phone', 'email'],
      options: { limit: 0 }
    });

    const contacts = (contactsResponse.values || []).map((contact: any) => ({
      id: String(contact.id),
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      status: 'pending'
    }));

    return NextResponse.json({
      list_id: listId,
      list_name: group.title || group.name,
      survey_id: null, // Can be linked later if needed
      contacts
    });

  } catch (error) {
    console.error('Error fetching contacts from CiviCRM:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}