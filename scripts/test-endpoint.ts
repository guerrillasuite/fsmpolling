// scripts/test-endpoint.ts
/**
 * Simple endpoint tester to diagnose CiviCRM connection issues
 */

import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });

const endpoint = process.env.CIVICRM_API_ENDPOINT || '';
const siteKey = process.env.CIVICRM_SITE_KEY || '';
const apiKey = process.env.CIVICRM_API_KEY || '';

console.log('🔍 CiviCRM Endpoint Diagnostics\n');

console.log('Configuration:');
console.log('  Endpoint:', endpoint);
console.log('  Site Key:', siteKey ? `${siteKey.substring(0, 10)}...` : 'MISSING');
console.log('  API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
console.log('');

if (!endpoint || !siteKey || !apiKey) {
  console.error('❌ Missing credentials in .env.local');
  process.exit(1);
}

async function testEndpoint() {
  // Build URL manually
  const url = new URL(endpoint);
  url.searchParams.set('key', siteKey);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('entity', 'Contact');
  url.searchParams.set('action', 'get');
  url.searchParams.set('json', '1');
  url.searchParams.set('sequential', '1');
  url.searchParams.set('options', JSON.stringify({ limit: 1 }));

  console.log('Testing URL:');
  console.log(url.toString().substring(0, 150) + '...');
  console.log('');

  try {
    console.log('Sending request...');
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LNC-Polling-App/1.0',
      },
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    const text = await response.text();
    console.log('Response Body (first 500 chars):');
    console.log(text.substring(0, 500));
    console.log('');

    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      console.log('✅ Valid JSON response');
      console.log('Parsed data:', JSON.stringify(data, null, 2).substring(0, 500));

      if (data.is_error === 0) {
        console.log('✅ CiviCRM API returned success!');
        if (data.count !== undefined) {
          console.log(`Found ${data.count} contacts`);
        }
      } else {
        console.log('❌ CiviCRM API returned error:');
        console.log(data.error_message || data);
      }
    } catch (parseError) {
      console.log('❌ Response is not valid JSON');
      console.log('Parse error:', parseError instanceof Error ? parseError.message : String(parseError));
    }
  } catch (error) {
    console.error('❌ Request failed:');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('\nFull error:', error);
  }
}

testEndpoint();
