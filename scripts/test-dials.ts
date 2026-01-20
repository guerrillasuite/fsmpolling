// scripts/test-dials.ts
/**
 * Test dials API - fetching groups from CiviCRM
 */

import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  console.log('🔍 Testing Dials API - Fetching Groups from CiviCRM\n');

  try {
    // Test 1: Get all dial lists (groups)
    console.log('Test 1: Fetching all dial lists...');
    const listsResponse = await fetch('http://localhost:3001/api/dials/lists');
    const listsData = await listsResponse.json();

    if (listsResponse.ok) {
      console.log('✅ Successfully fetched dial lists!');
      console.log(`Found ${listsData.lists?.length || 0} groups:`);
      listsData.lists?.forEach((list: any) => {
        console.log(`  - ${list.name} (ID: ${list.id}) - ${list.total_contacts} contacts`);
      });
      console.log('');

      // Test 2: Get contacts from Test Group (if it exists)
      const testGroup = listsData.lists?.find((list: any) =>
        list.name.toLowerCase().includes('test')
      );

      if (testGroup) {
        console.log(`Test 2: Fetching contacts from "${testGroup.name}" (ID: ${testGroup.id})...`);
        const contactsResponse = await fetch(`http://localhost:3001/api/dials/lists/${testGroup.id}/contacts`);
        const contactsData = await contactsResponse.json();

        if (contactsResponse.ok) {
          console.log('✅ Successfully fetched contacts!');
          console.log(`Found ${contactsData.contacts?.length || 0} contacts:`);
          contactsData.contacts?.forEach((contact: any, index: number) => {
            console.log(`  ${index + 1}. ${contact.first_name} ${contact.last_name} - ${contact.phone || 'No phone'}`);
          });
        } else {
          console.log('❌ Failed to fetch contacts');
          console.log('Error:', contactsData);
        }
      } else {
        console.log('⚠️  No "Test Group" found in the lists');
        console.log('Available groups:', listsData.lists?.map((l: any) => l.name).join(', '));
      }
    } else {
      console.log('❌ Failed to fetch dial lists');
      console.log('Error:', listsData);
    }
  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error);
  }
}

main();
