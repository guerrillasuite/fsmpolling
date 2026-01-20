// scripts/test-consent-submit.ts
/**
 * Test SMS consent submission
 */

import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  console.log('🧪 Testing SMS Consent Submission\n');

  const testData = {
    firstName: 'Test',
    lastName: 'Delegate',
    state: 'CA',
    cellNumber: '(555) 123-4567',
    email: 'test.delegate@example.com',
    consent: true
  };

  console.log('Submitting test consent with data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('');

  try {
    const response = await fetch('http://localhost:3001/api/consent/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    console.log(`Response status: ${response.status}`);
    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ Consent submission successful!');
      console.log('Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('\n❌ Consent submission failed');
      console.log('Error:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
  }
}

main();
