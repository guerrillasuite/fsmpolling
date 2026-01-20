// app/api/civicrm/test-connection/route.ts
/**
 * Test endpoint to verify CiviCRM connection and discover custom field IDs
 * Access via: /api/civicrm/test-connection
 */

import { NextResponse } from 'next/server';
import { getCiviCRMClient } from '@/lib/civicrm/client';

export async function GET() {
  const client = getCiviCRMClient();

  try {
    const results: any = {
      status: 'Testing CiviCRM connection...',
      customFields: {},
      errors: [],
    };

    // Test 1: Get Poll Responses custom group
    try {
      const fields = await client.getCustomFieldsByGroup('Poll_Responses');
      results.customFields = fields;
      results.status = 'Connected successfully!';

      // Build helpful mapping
      results.fieldMapping = {};
      Object.keys(fields).forEach(fieldName => {
        const field = fields[fieldName];
        results.fieldMapping[fieldName] = {
          id: field.id,
          customFieldKey: `custom_${field.id}`,
          label: field.label,
          dataType: field.data_type,
        };
      });
    } catch (error) {
      results.errors.push({
        test: 'Get custom fields',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 2: Try to get a sample contact
    try {
      const contactResponse = await client['apiCall']('Contact', 'get', {
        sequential: 1,
        options: { limit: 1 },
      });

      results.sampleContact = contactResponse.values?.[0] || 'No contacts found';
    } catch (error) {
      results.errors.push({
        test: 'Get sample contact',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json(results, {
      status: results.errors.length > 0 ? 500 : 200,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'Connection failed',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
