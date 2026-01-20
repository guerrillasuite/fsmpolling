// scripts/test-civicrm.ts
/**
 * Test script to verify CiviCRM integration
 * Run with: tsx scripts/test-civicrm.ts
 */

import { getCiviCRMClient } from '../lib/civicrm/client';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  console.log('🔍 Testing CiviCRM Integration\n');

  const client = getCiviCRMClient();

  // Test 1: Connection
  console.log('1️⃣ Testing API Connection...');
  try {
    const result = await client['apiCall']('Contact', 'get', {
      sequential: 1,
      options: { limit: 1 },
    });

    console.log('✅ Connection successful!');
    console.log(`   Found ${result.count || 0} contacts (showing 1)`);

    if (result.values && result.values[0]) {
      console.log(`   Sample: ${result.values[0].display_name} (ID: ${result.values[0].id})`);
    }
  } catch (error) {
    console.error('❌ Connection failed:', error instanceof Error ? error.message : String(error));
    console.log('\n⚠️  Check your .env.local file and verify:');
    console.log('   - CIVICRM_API_ENDPOINT is correct');
    console.log('   - CIVICRM_SITE_KEY is correct');
    console.log('   - CIVICRM_API_KEY is correct');
    process.exit(1);
  }

  // Test 2: Get Poll Responses custom group
  console.log('\n2️⃣ Discovering Custom Fields...');
  try {
    const fields = await client.getCustomFieldsByGroup('Poll_Responses');
    const fieldCount = Object.keys(fields).length;

    console.log(`✅ Found custom field group "Poll_Responses" with ${fieldCount} fields:`);

    Object.keys(fields).sort().forEach(fieldName => {
      const field = fields[fieldName];
      console.log(`   - ${field.label} (${fieldName}) → custom_${field.id}`);
    });

    // Verify we have all expected fields
    const expectedFields = [
      'Response_1', 'Response_2', 'Response_3', 'Response_4', 'Response_5',
      'Response_6', 'Response_7', 'Response_8', 'Response_9', 'Response_10',
      'Completion_Date_and_Time'
    ];

    const missingFields = expectedFields.filter(f => !fields[f]);

    if (missingFields.length > 0) {
      console.log(`\n⚠️  Missing expected fields: ${missingFields.join(', ')}`);
      console.log('   Create these fields in CiviCRM or update the expected list.');
    } else {
      console.log('\n✅ All expected fields are present!');
    }
  } catch (error) {
    console.error('❌ Failed to get custom fields:', error instanceof Error ? error.message : String(error));
    console.log('\n⚠️  Make sure you have a custom field group named "Poll_Responses" in CiviCRM.');
    process.exit(1);
  }

  // Test 3: Test creating a tag
  console.log('\n3️⃣ Testing Tag Creation...');
  try {
    const testTagName = 'Test: CiviCRM Integration';

    // Try to create or get the tag
    const tagResponse = await client['apiCall']('Tag', 'get', {
      name: testTagName,
      sequential: 1,
    });

    if (tagResponse.values && tagResponse.values.length > 0) {
      console.log(`✅ Tag "${testTagName}" already exists (ID: ${tagResponse.values[0].id})`);
    } else {
      const createResponse = await client['apiCall']('Tag', 'create', {
        name: testTagName,
        description: 'Test tag created by integration script',
        used_for: 'civicrm_contact',
      });

      console.log(`✅ Created test tag "${testTagName}" (ID: ${createResponse.id})`);
    }
  } catch (error) {
    console.error('❌ Tag creation failed:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n✨ CiviCRM integration test complete!\n');
  console.log('Next steps:');
  console.log('1. Complete a test poll in your app');
  console.log('2. Check the console logs for CiviCRM sync messages');
  console.log('3. Verify the data appears in CiviCRM');
  console.log('4. Visit /api/civicrm/test-connection in your browser for live diagnostics');
}

main().catch(console.error);
