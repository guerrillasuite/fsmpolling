import { config } from 'dotenv';
import path from 'path';
import { pushPollToCiviCRM } from '../lib/civicrm/poll-sync';

config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  console.log('🔄 Testing Numeric Contact ID Sync\n');

  // Use test-user-1 data with CiviCRM contact ID 3 (the "API" contact)
  const contactId = "5"; // Numeric CiviCRM contact ID
  const surveyId = 'lnc-chair-2025';

  console.log(`Contact ID: ${contactId} (will be used as CiviCRM ID)`);
  console.log(`Survey ID: ${surveyId}\n`);

  try {
    console.log('Pushing to CiviCRM...');
    // Note: We're passing the numeric ID, so no contactInfo needed!
    await pushPollToCiviCRM(contactId, surveyId);
    console.log('\n✅ Success!');
    console.log('Check CiviCRM contact ID 3 for the poll responses.');
  } catch (error) {
    console.error('\n❌ Sync failed:');
    console.error(error);
  }
}

main();
