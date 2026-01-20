// scripts/manual-sync-test.ts
/**
 * Manually test syncing a poll response to CiviCRM
 */

import { config } from 'dotenv';
import path from 'path';
import { pushPollToCiviCRM } from '../lib/civicrm/poll-sync';

config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  console.log('🔄 Manual CiviCRM Sync Test\n');

  // Use the most recent completed survey
  const contactId = 'test-user-2';
  const surveyId = 'lnc-chair-2025';

  // Provide test contact info since Q8 doesn't have email
  const testContactInfo = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'johndoe@example.com', // Test email
    phone: '555-1234'
  };

  console.log(`Contact ID: ${contactId}`);
  console.log(`Survey ID: ${surveyId}`);
  console.log(`Test Email: ${testContactInfo.email}\n`);

  try {
    console.log('Pushing to CiviCRM...');
    await pushPollToCiviCRM(contactId, surveyId, testContactInfo);
    console.log('\n✅ Success! Check CiviCRM for the contact.');
    console.log(`   Search for: ${testContactInfo.email}`);
  } catch (error) {
    console.error('\n❌ Sync failed:');
    console.error(error);
  }
}

main();
