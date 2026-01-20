# CiviCRM Integration Guide

This document explains how the polling app integrates with CiviCRM to store poll responses.

## Overview

When a user completes a poll, the app automatically:
1. Saves responses to the local SQLite database
2. Pushes responses to CiviCRM custom fields
3. Creates or updates the contact in CiviCRM
4. Applies tags based on multiple-select answers

## Setup

### 1. Environment Variables

The integration requires three environment variables in `.env.local`:

```env
CIVICRM_API_ENDPOINT=https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/ajax/rest
CIVICRM_SITE_KEY=4JEeMFOoCM781tbK2aQkz00koyx65wMnra3YVjdmI
CIVICRM_API_KEY=7k9mP2xQwN5vL8jR4tY6hF3nB1cV0zAe
```

**Important:** The API endpoint was corrected from `https://http://...` to `https://...`

### 2. CiviCRM Custom Fields

The integration expects a custom field group called **"Poll Responses"** with these fields:

| Field Name | Field Type | Internal Name | Purpose |
|------------|------------|---------------|---------|
| Response 1 | Text | `Response_1` | First question answer |
| Response 2 | Text | `Response_2` | Second question answer |
| Response 3 | Text | `Response_3` | Third question answer |
| Response 4 | Text | `Response_4` | Fourth question answer |
| Response 5 | Text | `Response_5` | Fifth question answer |
| Response 6 | Text | `Response_6` | Sixth question answer |
| Response 7 | Text | `Response_7` | Seventh question answer |
| Response 8 | Text | `Response_8` | Eighth question answer |
| Response 9 | Text | `Response_9` | Ninth question answer |
| Response 10 | Text | `Response_10` | Tenth question answer |
| Completion Date and Time | Date | `Completion_Date_and_Time` | When poll was completed |

### 3. Verify Connection

After setting up environment variables, test the connection:

```bash
curl http://localhost:3001/api/civicrm/test-connection
```

This will:
- Test CiviCRM API connectivity
- Discover custom field IDs
- Display the mapping of fields to `custom_X` format
- Show a sample contact

## How It Works

### Automatic Sync on Completion

When a user clicks "Submit Survey", the `/api/survey/complete` endpoint:

1. Marks the survey as complete in local DB
2. Retrieves all responses for that contact/survey
3. Gets contact info from the contact verification question (if present)
4. Calls `pushPollToCiviCRM()` which:
   - Discovers custom field IDs from CiviCRM
   - Maps responses to `custom_X` fields
   - Creates or finds the contact by email
   - Updates contact with all poll responses
   - Applies tags for multiple-select answers

### Response Formatting

- **Single choice:** Stored as plain text (e.g., "Evan McMahon")
- **Multiple select:** Comma-separated (e.g., "Gun Rights, Taxation, Immigration")
- **With "Other" text:** Appended in parentheses (e.g., "Other (Ron Paul)")
- **Contact verification:** Stored as JSON in Response 8

### Tagging

The integration automatically creates and applies tags:

- **Political issues (Q4):** Each selected issue becomes a tag: `Issue: Gun Rights`, `Issue: Taxation`, etc.
- **LNC Chair vote (Q1):** Creates tag like `LNC Chair: Evan McMahon` (unless "Undecided")

You can customize tag extraction in `lib/civicrm/poll-sync.ts` (see `extractTagsFromResponses()` function).

## Manual Sync

To manually re-sync a poll response (useful for testing or fixing failed syncs):

```bash
curl -X POST http://localhost:3001/api/civicrm/sync-poll \
  -H "Content-Type: application/json" \
  -d '{"crm_contact_id": "test-user-123", "survey_id": "lnc-chair-2025"}'
```

## Error Handling

The integration is designed to be fault-tolerant:

- If CiviCRM sync fails, the poll is still marked complete in the local database
- Errors are logged to the console
- The frontend receives a warning message if sync failed
- You can manually re-sync later using the `/api/civicrm/sync-poll` endpoint

## Finding Custom Field IDs

Custom field IDs are automatically discovered at runtime. To see the mapping:

1. Visit `/api/civicrm/test-connection`
2. Look for the `fieldMapping` object
3. Each field shows its `custom_X` format

Example output:
```json
{
  "Response_1": {
    "id": 12,
    "customFieldKey": "custom_12",
    "label": "Response 1",
    "dataType": "String"
  }
}
```

## Files

### Core Integration Files

- `lib/civicrm/client.ts` - CiviCRM REST API client
- `lib/civicrm/poll-sync.ts` - Poll-specific sync logic
- `app/api/survey/complete/route.ts` - Survey completion with CiviCRM sync

### Utility Endpoints

- `app/api/civicrm/test-connection/route.ts` - Test connection and discover field IDs
- `app/api/civicrm/sync-poll/route.ts` - Manual sync endpoint

## Troubleshooting

### 1. "Custom group not found"

Make sure the custom group is named exactly **"Poll_Responses"** (with underscore, not space) in CiviCRM's internal name.

### 2. "Cannot determine CiviCRM contact ID"

The `crm_contact_id` passed from the survey must either be:
- A numeric CiviCRM contact ID, OR
- Any string, but the user must fill out the contact verification question (Q8) with their email

### 3. API endpoint errors

Check that your endpoint URL doesn't have double protocols (should be `https://` not `https://http://`).

### 4. Tags not appearing

Tags are created on-the-fly. Check:
- CiviCRM > Contacts > Manage Tags
- They should be under "Used For: Contacts"

## Extending the Integration

### Add More Tags

Edit `lib/civicrm/poll-sync.ts` and modify the `extractTagsFromResponses()` function:

```typescript
// Example: Tag by party membership duration
const membershipQ = responses.find(r => r.questionId === 'lnc-chair-q6');
if (membershipQ) {
  tags.push(`Member Duration: ${membershipQ.answerValue}`);
}
```

### Store Additional Contact Fields

Modify `lib/civicrm/poll-sync.ts` in the `findOrCreateContact()` call to add phone, address, etc:

```typescript
civiContactId = await client.findOrCreateContact({
  contact_type: 'Individual',
  first_name: contactInfo.firstName,
  last_name: contactInfo.lastName,
  email: contactInfo.email,
  phone: contactInfo.phone, // Add phone
});
```

### Sync to Activities Instead of Custom Fields

You could create CiviCRM Activities for each poll response. See the CiviCRM Activity API docs.

## Security Notes

- API keys are stored in `.env.local` (never commit this file!)
- The CiviCRM API uses site key + API key authentication
- All API calls use HTTPS
- Failed syncs don't expose errors to the frontend user

## Support

For CiviCRM API documentation:
- https://docs.civicrm.org/dev/en/latest/api/
- Your CiviCRM: https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/api
