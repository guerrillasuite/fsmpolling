// app/api/civicrm/debug/route.ts
/**
 * Debug endpoint to check environment variables
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    endpoint: process.env.CIVICRM_API_ENDPOINT || 'NOT SET',
    siteKey: process.env.CIVICRM_SITE_KEY ? `${process.env.CIVICRM_SITE_KEY.substring(0, 10)}...` : 'NOT SET',
    apiKey: process.env.CIVICRM_API_KEY ? `${process.env.CIVICRM_API_KEY.substring(0, 10)}...` : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('CIVICRM')),
  });
}
