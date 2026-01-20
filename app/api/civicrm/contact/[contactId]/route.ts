// app/api/civicrm/contact/[contactId]/route.ts
/**
 * Fetch contact information from CiviCRM
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCiviCRMClient } from '@/lib/civicrm/client';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await context.params;

  if (!contactId) {
    return NextResponse.json(
      { error: 'Missing contactId' },
      { status: 400 }
    );
  }

  try {
    const client = getCiviCRMClient();

    // Check if contactId is numeric (CiviCRM ID) or needs lookup
    let civiContactId: number;

    if (/^\d+$/.test(contactId)) {
      // It's already a numeric CiviCRM ID
      civiContactId = parseInt(contactId, 10);
    } else {
      // Try to find by external_identifier
      const searchResponse = await client['apiCall']('Contact', 'get', {
        external_identifier: contactId,
        sequential: 1,
      });

      if (searchResponse.values && Array.isArray(searchResponse.values) && searchResponse.values.length > 0) {
        civiContactId = searchResponse.values[0].id;
      } else {
        return NextResponse.json({
          success: false,
          error: 'Contact not found',
          data: null,
        });
      }
    }

    // Fetch contact with email and phone
    const contactResponse = await client['apiCall']('Contact', 'get', {
      id: civiContactId,
      sequential: 1,
      return: ['first_name', 'last_name', 'email', 'phone'],
    });

    if (!contactResponse.values || !Array.isArray(contactResponse.values) || contactResponse.values.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Contact not found',
        data: null,
      });
    }

    const contact = contactResponse.values[0];

    // Format the response
    return NextResponse.json({
      success: true,
      data: {
        id: contact.id,
        name: [contact.first_name, contact.last_name].filter(Boolean).join(' ') || undefined,
        firstName: contact.first_name || undefined,
        lastName: contact.last_name || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
      },
    });
  } catch (error) {
    console.error('Failed to fetch contact from CiviCRM:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: null,
    }, { status: 500 });
  }
}
