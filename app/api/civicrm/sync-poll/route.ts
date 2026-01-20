// app/api/civicrm/sync-poll/route.ts
/**
 * Manual endpoint to sync a specific poll response to CiviCRM
 * Useful for re-syncing or testing
 *
 * Usage: POST /api/civicrm/sync-poll
 * Body: { crm_contact_id: string, survey_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { pushPollToCiviCRM, getContactInfoFromResponses } from '@/lib/civicrm/poll-sync';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { crm_contact_id, survey_id } = body;

    if (!crm_contact_id || !survey_id) {
      return NextResponse.json(
        { error: 'Missing crm_contact_id or survey_id' },
        { status: 400 }
      );
    }

    // Get contact info from responses
    const contactInfo = getContactInfoFromResponses(crm_contact_id, survey_id);

    // Push to CiviCRM
    await pushPollToCiviCRM(crm_contact_id, survey_id, contactInfo || undefined);

    return NextResponse.json({
      success: true,
      message: `Successfully synced poll for contact ${crm_contact_id} to CiviCRM`,
    });
  } catch (error) {
    console.error('Manual sync failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
