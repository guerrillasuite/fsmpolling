# CiviCRM Integration Setup Guide

This guide walks you through integrating your polling app with CiviCRM step-by-step.

## Prerequisites

✅ CiviCRM is installed on WordPress
✅ You have CiviCRM administrator access
✅ You have your API credentials (Site Key and API Key)

## Step 1: Verify Your Credentials

You provided these credentials:

- **Site Key:** `4JEeMFOoCM781tbK2aQkz00koyx65wMnra3YVjdmI`
- **API Key:** `7k9mP2xQwN5vL8jR4tY6hF3nB1cV0zAe`
- **API Endpoint:** `https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/ajax/rest`

> ⚠️ **Note:** I corrected your endpoint from `https://http://...` to `https://...`

These are already configured in `.env.local`.

## Step 2: Set Up CiviCRM Custom Fields

You mentioned custom fields are already set up. Let's verify they match what the code expects:

### Custom Field Group

- **Name:** "Poll Responses"
- **Internal Name:** `Poll_Responses` (important!)
- **Used For:** Contacts (Individuals)

### Custom Fields in the Group

| Field Label | Internal Name | Field Type | Notes |
|------------|---------------|------------|-------|
| Response 1 | `Response_1` | Text/Alphanumeric | Question 1 answer |
| Response 2 | `Response_2` | Text/Alphanumeric | Question 2 answer |
| Response 3 | `Response_3` | Text/Alphanumeric | Question 3 answer |
| Response 4 | `Response_4` | Text/Alphanumeric | Question 4 answer |
| Response 5 | `Response_5` | Text/Alphanumeric | Question 5 answer |
| Response 6 | `Response_6` | Text/Alphanumeric | Question 6 answer |
| Response 7 | `Response_7` | Text/Alphanumeric | Question 7 answer |
| Response 8 | `Response_8` | Text/Alphanumeric | Question 8 answer |
| Response 9 | `Response_9` | Text/Alphanumeric | Question 9 answer |
| Response 10 | `Response_10` | Text/Alphanumeric | Question 10 answer |
| Completion Date and Time | `Completion_Date_and_Time` | Date | Poll completion timestamp |

### How to Check in CiviCRM

1. Log into CiviCRM
2. Go to: **Administer** → **Customize Data and Screens** → **Custom Fields**
3. Find the "Poll Responses" custom field set
4. Click **View and Edit Custom Fields**
5. Verify the internal names match the table above

> 💡 **Internal names are critical!** The code looks for `Response_1`, `Response_2`, etc. (with underscores).

## Step 3: Find Your Custom Field IDs

The integration automatically discovers field IDs, but you can verify manually:

### Method 1: Using the Test Script

```bash
npm run test:civicrm
```

This will show all discovered fields and their `custom_X` IDs.

### Method 2: Using the Browser

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open in browser:
   ```
   http://localhost:3001/api/civicrm/test-connection
   ```

3. Look for the `fieldMapping` section in the JSON response

### Method 3: CiviCRM API Explorer

1. In CiviCRM, go to: **Support** → **Developer** → **API Explorer v3**
2. Entity: `CustomField`
3. Action: `get`
4. Add parameter: `custom_group_id` = your Poll Responses group ID
5. Click **Execute**

## Step 4: Test the Integration

### 4.1 Test the Connection

```bash
npm run test:civicrm
```

Expected output:
```
🔍 Testing CiviCRM Integration

1️⃣ Testing API Connection...
✅ Connection successful!
   Found 5 contacts (showing 1)
   Sample: John Doe (ID: 123)

2️⃣ Discovering Custom Fields...
✅ Found custom field group "Poll_Responses" with 11 fields:
   - Completion Date and Time (Completion_Date_and_Time) → custom_45
   - Response 1 (Response_1) → custom_34
   - Response 2 (Response_2) → custom_35
   ...

✅ All expected fields are present!

3️⃣ Testing Tag Creation...
✅ Tag "Test: CiviCRM Integration" already exists (ID: 12)

✨ CiviCRM integration test complete!
```

### 4.2 Test with a Real Poll Response

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Complete a test poll:
   ```
   http://localhost:3001/survey/lnc-chair-2025?contact_id=test-user-1
   ```

3. Fill out all questions and submit

4. Check the server console for sync messages:
   ```
   ✓ Updated CiviCRM contact 123 with poll responses
   ✓ Applied 3 tags to contact 123
   ✓ Successfully synced poll to CiviCRM for contact test-user-1
   ```

5. Verify in CiviCRM:
   - Find the contact
   - Check the "Poll Responses" custom fields are populated
   - Check that tags were applied (under Tags tab)

### 4.3 Manual Sync (if needed)

If a sync failed, you can manually re-sync:

```bash
curl -X POST http://localhost:3001/api/civicrm/sync-poll \
  -H "Content-Type: application/json" \
  -d '{"crm_contact_id": "test-user-1", "survey_id": "lnc-chair-2025"}'
```

## Step 5: Understanding the Data Flow

### When a User Completes a Poll

1. **Frontend** ([SurveyContainer.tsx](app/components/survey/SurveyContainer.tsx)):
   - User answers questions
   - Each answer is saved via `/api/survey/response`
   - User clicks "Submit Survey"

2. **Response Endpoint** ([route.ts](app/api/survey/response/route.ts)):
   - Saves each answer to SQLite database
   - Updates session tracking

3. **Complete Endpoint** ([route.ts](app/api/survey/complete/route.ts)):
   - Marks survey as complete in SQLite
   - **NEW:** Calls `pushPollToCiviCRM()`
   - Syncs data to CiviCRM

4. **CiviCRM Sync** ([poll-sync.ts](lib/civicrm/poll-sync.ts)):
   - Fetches all responses from SQLite
   - Discovers custom field IDs
   - Formats responses for CiviCRM
   - Creates/updates contact
   - Updates custom fields
   - Applies tags

### What Gets Stored Where

| Question | Response Format | CiviCRM Field | Example |
|----------|----------------|---------------|---------|
| Q1: LNC Chair vote | Single choice | Response 1 (`custom_34`) | "Evan McMahon" |
| Q2: Bylaws amendment | Yes/No | Response 2 (`custom_35`) | "Yes" |
| Q3: How joined party | Single choice + Other | Response 3 (`custom_36`) | "Other (Ron Paul)" |
| Q4: Top 3 issues | Multiple select | Response 4 (`custom_37`) | "Gun Rights, Taxation, Immigration" |
| Q5: 2024 vote | Single choice | Response 5 (`custom_38`) | "Chase Oliver" |
| Q6: Membership duration | Range | Response 6 (`custom_39`) | "5-10 Years" |
| Q7: Donation motivator | Single choice | Response 7 (`custom_40`) | "More/Better Candidates" |
| Q8: Contact info | JSON | Response 8 (`custom_41`) | {"email":"...", ...} |
| - | Completion date | Completion Date (`custom_45`) | "2025-01-19" |

### Tags Applied

- **Political Issues (Q4):** Each issue becomes a tag
  - `Issue: Gun Rights`
  - `Issue: Taxation`
  - `Issue: Immigration`

- **LNC Chair Vote (Q1):** If not "Undecided"
  - `LNC Chair: Evan McMahon`

## Step 6: Deploy to Production

Once tested locally:

1. Add environment variables to Railway (or your host):
   ```
   CIVICRM_API_ENDPOINT=https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/ajax/rest
   CIVICRM_SITE_KEY=4JEeMFOoCM781tbK2aQkz00koyx65wMnra3YVjdmI
   CIVICRM_API_KEY=7k9mP2xQwN5vL8jR4tY6hF3nB1cV0zAe
   ```

2. Push your code to Git:
   ```bash
   git add .
   git commit -m "Add CiviCRM integration"
   git push
   ```

3. Railway will auto-deploy

4. Test on production:
   ```
   https://polling.freespeechmedia.live/api/civicrm/test-connection
   ```

## Troubleshooting

### Error: "Custom group not found"

**Problem:** The code can't find the "Poll_Responses" custom group.

**Solution:**
1. Check the internal name is exactly `Poll_Responses` (with underscore)
2. Make sure it's assigned to "Contacts - Individuals"
3. Verify it's not disabled

### Error: "Cannot determine CiviCRM contact ID"

**Problem:** The `crm_contact_id` isn't recognized.

**Solutions:**
- If using email lookup: Ensure users fill out Question 8 (contact verification)
- If using numeric IDs: Pass a real CiviCRM contact ID in the URL
  ```
  /survey/lnc-chair-2025?contact_id=123
  ```

### Error: "HTTP 403: Forbidden"

**Problem:** API authentication failed.

**Solutions:**
1. Verify your Site Key and API Key are correct
2. Check that the API Key user has proper permissions in CiviCRM
3. Ensure CiviCRM REST API is enabled

### Tags Not Appearing

**Problem:** Tags aren't showing up in CiviCRM.

**Check:**
1. Go to: **Contacts** → **Manage Tags**
2. Look for tags starting with "Issue:" or "LNC Chair:"
3. They should be under "Used For: Contacts"

Tags are auto-created, so if they don't exist, check console logs for errors.

### Sync Failed but Poll Saved

**This is expected behavior!** The integration is fault-tolerant:
- Poll is always saved to local SQLite database
- If CiviCRM sync fails, the poll is still marked complete
- You can manually re-sync later using `/api/civicrm/sync-poll`

## Advanced Customization

### Add More Tags

Edit [`lib/civicrm/poll-sync.ts`](lib/civicrm/poll-sync.ts), function `extractTagsFromResponses()`:

```typescript
// Tag by who they voted for in 2024
const voteQ = responses.find(r => r.questionId === 'lnc-chair-q5');
if (voteQ && voteQ.answerValue) {
  tags.push(`2024 Vote: ${voteQ.answerValue}`);
}
```

### Store Phone Numbers

Edit [`lib/civicrm/poll-sync.ts`](lib/civicrm/poll-sync.ts), in the `findOrCreateContact()` call:

```typescript
civiContactId = await client.findOrCreateContact({
  contact_type: 'Individual',
  first_name: contactInfo.firstName,
  last_name: contactInfo.lastName,
  email: contactInfo.email,
  phone: contactInfo.phone, // Add this line
});
```

### Change Response Format

Edit [`lib/civicrm/poll-sync.ts`](lib/civicrm/poll-sync.ts), function `formatResponseForCiviCRM()`:

```typescript
// Example: Use semicolons instead of commas for multi-select
if (Array.isArray(parsed)) {
  formatted = parsed.join('; '); // Changed from ', '
}
```

## Support & Documentation

- **CiviCRM API Docs:** https://docs.civicrm.org/dev/en/latest/api/
- **Your CiviCRM API Explorer:** https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/api
- **Integration Details:** See [CIVICRM_INTEGRATION.md](CIVICRM_INTEGRATION.md)

## Summary

✅ **Created Files:**
- `lib/civicrm/client.ts` - CiviCRM REST API client
- `lib/civicrm/poll-sync.ts` - Poll-specific sync logic
- `app/api/civicrm/test-connection/route.ts` - Test endpoint
- `app/api/civicrm/sync-poll/route.ts` - Manual sync endpoint
- `scripts/test-civicrm.ts` - CLI test script

✅ **Modified Files:**
- `app/api/survey/complete/route.ts` - Added CiviCRM sync on completion
- `.env.local` - Added API credentials
- `package.json` - Added test script

✅ **Next Steps:**
1. Run `npm run test:civicrm` to verify connection
2. Complete a test poll
3. Check data in CiviCRM
4. Deploy to production
