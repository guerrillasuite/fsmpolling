// app/api/consent/submit/route.ts
/**
 * Handle SMS consent form submission
 * - Find contact in "Delegates" group by name and state
 * - Update contact with phone and email
 * - Add "SMS Consent" tag
 * - Create new contact if not found
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCiviCRMClient } from '@/lib/civicrm/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, state, cellNumber, email } = body;

    // Validate required fields
    if (!firstName || !lastName || !state || !cellNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = getCiviCRMClient();

    // Step 1: Get the "Delegates" group ID
    let delegatesGroupId: number | null = null;
    try {
      const groupResponse = await client['apiCall']('Group', 'get', {
        name: 'Delegates',
        sequential: 1,
      });

      if (groupResponse.values && Array.isArray(groupResponse.values) && groupResponse.values.length > 0) {
        delegatesGroupId = groupResponse.values[0].id;
      }
    } catch (groupErr) {
      console.warn('Could not fetch Delegates group:', groupErr);
    }

    // Step 2: Search for existing contact in Delegates group
    let contactId: number | null = null;

    if (delegatesGroupId) {
      try {
        // Search for contact by first name, last name, and state in the Delegates group
        const searchResponse = await client['apiCall']('Contact', 'get', {
          first_name: firstName,
          last_name: lastName,
          'state_province-1.abbreviation': state, // Custom field for state abbreviation
          group: delegatesGroupId,
          sequential: 1,
        });

        if (searchResponse.values && Array.isArray(searchResponse.values) && searchResponse.values.length > 0) {
          contactId = searchResponse.values[0].id;
          console.log(`Found existing contact in Delegates group: ${contactId}`);
        }
      } catch (searchErr) {
        console.warn('Error searching for contact in Delegates group:', searchErr);
      }
    }

    // Step 3: If contact found, update it. Otherwise, create new contact.
    if (contactId) {
      // Update existing contact
      await client['apiCall']('Contact', 'create', {
        id: contactId,
        phone: cellNumber,
        ...(email && { email }),
      });
      console.log(`Updated contact ${contactId} with phone and email`);
    } else {
      // Create new contact
      const createResponse = await client['apiCall']('Contact', 'create', {
        contact_type: 'Individual',
        first_name: firstName,
        last_name: lastName,
        phone: cellNumber,
        ...(email && { email }),
      });

      if (!createResponse.id) {
        throw new Error('Failed to create contact');
      }

      contactId = createResponse.id;
      console.log(`Created new contact: ${contactId}`);

      // Add new contact to Delegates group if group exists
      if (delegatesGroupId) {
        try {
          await client['apiCall']('GroupContact', 'create', {
            group_id: delegatesGroupId,
            contact_id: contactId,
          });
          console.log(`Added contact ${contactId} to Delegates group`);
        } catch (groupAddErr) {
          console.warn('Failed to add contact to Delegates group:', groupAddErr);
        }
      }
    }

    // Step 4: Add "SMS Consent" tag
    try {
      await client.addTagsToContact(contactId, ['SMS Consent']);
      console.log(`Added "SMS Consent" tag to contact ${contactId}`);
    } catch (tagErr) {
      console.error('Failed to add SMS Consent tag:', tagErr);
      // Don't fail the whole request if tagging fails
    }

    return NextResponse.json({
      success: true,
      contactId,
      message: 'Consent recorded successfully',
    });
  } catch (error) {
    console.error('Failed to process consent:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
