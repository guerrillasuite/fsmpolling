// scripts/test-contact-fetch.ts
/**
 * Test fetching contact data from CiviCRM
 */

import { config } from 'dotenv';
import path from 'path';
import { getCiviCRMClient } from '../lib/civicrm/client';

config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  console.log('🔍 Testing Contact Data Fetch\n');

  const contactId = '5'; // Test with contact ID 5

  console.log(`Testing with contact ID: ${contactId}\n`);

  try {
    const client = getCiviCRMClient();

    // Fetch contact with email and phone
    const contactResponse = await client['apiCall']('Contact', 'get', {
      id: parseInt(contactId, 10),
      sequential: 1,
      return: ['first_name', 'last_name', 'email', 'phone'],
    });

    console.log('Raw CiviCRM response:');
    console.log(JSON.stringify(contactResponse, null, 2));

    if (!contactResponse.values || !Array.isArray(contactResponse.values) || contactResponse.values.length === 0) {
      console.log('\n❌ Contact not found');
      return;
    }

    const contact = contactResponse.values[0];

    console.log('\n✅ Contact found!');
    console.log('Formatted data:');
    console.log({
      id: contact.id,
      name: [contact.first_name, contact.last_name].filter(Boolean).join(' ') || undefined,
      firstName: contact.first_name || undefined,
      lastName: contact.last_name || undefined,
      email: contact.email || undefined,
      phone: contact.phone || undefined,
    });

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
  }
}

main();
