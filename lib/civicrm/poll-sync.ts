// lib/civicrm/poll-sync.ts
/**
 * Functions to sync poll responses to CiviCRM
 */

import { getCiviCRMClient } from './client';
import { getDatabase } from '@/lib/db/init';

export interface PollResponse {
  questionId: string;
  questionText: string;
  answerValue: string;
  answerText?: string;
}

export interface ContactInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

/**
 * Get custom field mapping for poll responses
 * This caches the mapping to avoid repeated API calls
 */
let customFieldCache: Record<string, string> | null = null;

async function getCustomFieldMapping(): Promise<Record<string, string>> {
  if (customFieldCache) {
    return customFieldCache;
  }

  const client = getCiviCRMClient();

  try {
    // Get all custom fields from the "Poll Responses" group
    const fields = await client.getCustomFieldsByGroup('Poll_Responses');

    const mapping: Record<string, string> = {};

    // Map Response 1 through Response 10
    for (let i = 1; i <= 10; i++) {
      const fieldName = `Response_${i}`;
      if (fields[fieldName]) {
        mapping[`response_${i}`] = `custom_${fields[fieldName].id}`;
      }
    }

    // Map Completion Date field
    if (fields.Completion_Date_and_Time) {
      mapping.completion_date = `custom_${fields.Completion_Date_and_Time.id}`;
    }

    customFieldCache = mapping;
    return mapping;
  } catch (error) {
    console.error('Failed to get custom field mapping:', error);
    throw error;
  }
}

/**
 * Format a response for storage in CiviCRM
 */
function formatResponseForCiviCRM(response: PollResponse): string {
  let formatted = response.answerValue;

  // If it's a JSON array (multiple select), format nicely
  try {
    const parsed = JSON.parse(response.answerValue);
    if (Array.isArray(parsed)) {
      formatted = parsed.join(', ');
    }
  } catch {
    // Not JSON, use as-is
  }

  // If there's additional text (like "Other" field), append it
  if (response.answerText) {
    formatted += ` (${response.answerText})`;
  }

  return formatted;
}

/**
 * Extract tags from multiple-select responses for tagging
 */
function extractTagsFromResponses(responses: PollResponse[]): string[] {
  const tags: string[] = [];

  // Find the political issues question (lnc-chair-q4)
  const politicalIssuesQ = responses.find(r => r.questionId === 'lnc-chair-q4');

  if (politicalIssuesQ) {
    try {
      const issues = JSON.parse(politicalIssuesQ.answerValue);
      if (Array.isArray(issues)) {
        // Add each issue as a tag with a prefix
        issues.forEach(issue => {
          tags.push(`Issue: ${issue}`);
        });
      }
    } catch {
      // Not JSON, skip tagging
    }
  }

  // You can add more tag extraction logic here for other questions
  // For example, tag by who they voted for:
  const voteQ = responses.find(r => r.questionId === 'lnc-chair-q1');
  if (voteQ && voteQ.answerValue && voteQ.answerValue !== 'Undecided') {
    tags.push(`LNC Chair: ${voteQ.answerValue}`);
  }

  return tags;
}

/**
 * Push poll responses to CiviCRM
 */
export async function pushPollToCiviCRM(
  crmContactId: string,
  surveyId: string,
  contactInfo?: ContactInfo
): Promise<void> {
  const client = getCiviCRMClient();
  const db = getDatabase();

  try {
    // 1. Get all responses for this contact/survey
    const responses = db.prepare(`
      SELECT
        r.question_id,
        q.question_text,
        r.answer_value,
        r.answer_text,
        q.order_index
      FROM responses r
      JOIN questions q ON r.question_id = q.id
      WHERE r.crm_contact_id = ? AND r.survey_id = ?
      ORDER BY q.order_index ASC
    `).all(crmContactId, surveyId) as any[];

    if (responses.length === 0) {
      console.warn(`No responses found for contact ${crmContactId}`);
      return;
    }

    // 2. Get custom field mapping
    const fieldMapping = await getCustomFieldMapping();

    // 3. Find or create contact in CiviCRM
    let civiContactId: number;

    // If crmContactId is numeric, assume it's already a CiviCRM ID
    if (/^\d+$/.test(crmContactId)) {
      civiContactId = parseInt(crmContactId, 10);
      console.log(`Using existing CiviCRM contact ID: ${civiContactId}`);
    } else if (contactInfo && contactInfo.email) {
      // Try to find/create by email
      civiContactId = await client.findOrCreateContact({
        contact_type: 'Individual',
        first_name: contactInfo.firstName,
        last_name: contactInfo.lastName,
        email: contactInfo.email,
      });
      console.log(`Found/created CiviCRM contact by email: ${civiContactId}`);
    } else {
      // No numeric ID and no email - try to parse as UUID or use hash
      console.warn(`Contact ID "${crmContactId}" is not numeric and no email provided. Attempting to find by external_identifier...`);

      // Try to find contact by external_identifier (in case UUIDs are stored there)
      const searchResponse = await client['apiCall']('Contact', 'get', {
        external_identifier: crmContactId,
        sequential: 1,
      });

      if (searchResponse.values && Array.isArray(searchResponse.values) && searchResponse.values.length > 0) {
        civiContactId = searchResponse.values[0].id;
        console.log(`Found contact by external_identifier: ${civiContactId}`);
      } else {
        throw new Error(`Cannot find CiviCRM contact. Contact ID "${crmContactId}" is not numeric, no email provided, and not found by external_identifier.`);
      }
    }

    // 4. Build custom field data object
    const customFieldData: Record<string, any> = {};

    // Map responses to custom fields (Response 1 through Response 10)
    responses.forEach((response, index) => {
      if (index < 10) { // Only first 10 responses
        const responseKey = `response_${index + 1}`;
        const customFieldKey = fieldMapping[responseKey];

        if (customFieldKey) {
          customFieldData[customFieldKey] = formatResponseForCiviCRM({
            questionId: response.question_id,
            questionText: response.question_text,
            answerValue: response.answer_value,
            answerText: response.answer_text,
          });
        }
      }
    });

    // Add completion timestamp
    if (fieldMapping.completion_date) {
      const now = new Date();
      customFieldData[fieldMapping.completion_date] = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    // 5. Update contact with custom field data
    await client.updateContactCustomFields(civiContactId, customFieldData);

    console.log(`✓ Updated CiviCRM contact ${civiContactId} with poll responses`);

    // 6. Apply tags for multiple-select answers
    const tags = extractTagsFromResponses(responses.map(r => ({
      questionId: r.question_id,
      questionText: r.question_text,
      answerValue: r.answer_value,
      answerText: r.answer_text,
    })));

    if (tags.length > 0) {
      await client.addTagsToContact(civiContactId, tags);
      console.log(`✓ Applied ${tags.length} tags to contact ${civiContactId}`);
    }

  } catch (error) {
    console.error('Failed to push poll to CiviCRM:', error);
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Helper to get contact info from the contact verification question
 */
export function getContactInfoFromResponses(crmContactId: string, surveyId: string): ContactInfo | null {
  const db = getDatabase();

  try {
    // Find the contact verification question response
    const response = db.prepare(`
      SELECT r.answer_value
      FROM responses r
      JOIN questions q ON r.question_id = q.id
      WHERE r.crm_contact_id = ?
        AND r.survey_id = ?
        AND q.question_type = 'contact_verification'
    `).get(crmContactId, surveyId) as any;

    if (response && response.answer_value) {
      try {
        const data = JSON.parse(response.answer_value);
        return {
          firstName: data.first_name || data.firstName,
          lastName: data.last_name || data.lastName,
          email: data.email,
          phone: data.phone,
        };
      } catch {
        return null;
      }
    }

    return null;
  } finally {
    db.close();
  }
}
