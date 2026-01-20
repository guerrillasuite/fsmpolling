# CiviCRM Integration API Reference

Quick reference for the CiviCRM integration endpoints and functions.

## API Endpoints

### Test Connection
```
GET /api/civicrm/test-connection
```

**Purpose:** Verify CiviCRM connectivity and discover custom field IDs

**Response:**
```json
{
  "status": "Connected successfully!",
  "customFields": { ... },
  "fieldMapping": {
    "Response_1": {
      "id": 34,
      "customFieldKey": "custom_34",
      "label": "Response 1",
      "dataType": "String"
    }
  },
  "sampleContact": { ... }
}
```

**Use Cases:**
- Initial setup verification
- Debugging connection issues
- Discovering custom field IDs after CiviCRM changes

---

### Manual Sync Poll
```
POST /api/civicrm/sync-poll
Content-Type: application/json

{
  "crm_contact_id": "test-user-123",
  "survey_id": "lnc-chair-2025"
}
```

**Purpose:** Manually sync a poll response to CiviCRM

**Response:**
```json
{
  "success": true,
  "message": "Successfully synced poll for contact test-user-123 to CiviCRM"
}
```

**Use Cases:**
- Re-sync after a failed sync
- Bulk re-syncing existing responses
- Testing the integration

---

### Survey Complete (Auto-sync)
```
POST /api/survey/complete
Content-Type: application/json

{
  "crm_contact_id": "test-user-123",
  "survey_id": "lnc-chair-2025"
}
```

**Purpose:** Mark survey as complete and automatically sync to CiviCRM

**Response:**
```json
{
  "success": true,
  "message": "Survey completed successfully"
}
```

**Note:** This endpoint is called automatically by the frontend when a user submits a survey.

---

## Code Functions

### CiviCRM Client

Located in: `lib/civicrm/client.ts`

#### `getCiviCRMClient()`
```typescript
import { getCiviCRMClient } from '@/lib/civicrm/client';

const client = getCiviCRMClient();
```

Returns a singleton instance of the CiviCRM client.

---

#### `client.getCustomField(fieldName: string)`
```typescript
const field = await client.getCustomField('Response_1');
// Returns: { id: 34, name: 'Response_1', label: 'Response 1', ... }
```

Get a single custom field by name.

---

#### `client.getCustomFieldsByGroup(groupName: string)`
```typescript
const fields = await client.getCustomFieldsByGroup('Poll_Responses');
// Returns: { Response_1: {...}, Response_2: {...}, ... }
```

Get all custom fields in a group.

---

#### `client.findOrCreateContact(contactData: CiviCRMContact)`
```typescript
const contactId = await client.findOrCreateContact({
  contact_type: 'Individual',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
});
// Returns: 123 (contact ID)
```

Find a contact by email, or create if not found.

---

#### `client.updateContactCustomFields(contactId: number, customFields: Record<string, any>)`
```typescript
await client.updateContactCustomFields(123, {
  custom_34: 'Evan McMahon',
  custom_35: 'Yes',
  custom_45: '2025-01-19'
});
```

Update custom fields on a contact.

---

#### `client.addTagsToContact(contactId: number, tags: string[])`
```typescript
await client.addTagsToContact(123, [
  'Issue: Gun Rights',
  'Issue: Taxation',
  'LNC Chair: Evan McMahon'
]);
```

Create and apply tags to a contact.

---

### Poll Sync Functions

Located in: `lib/civicrm/poll-sync.ts`

#### `pushPollToCiviCRM(crmContactId: string, surveyId: string, contactInfo?: ContactInfo)`
```typescript
import { pushPollToCiviCRM } from '@/lib/civicrm/poll-sync';

await pushPollToCiviCRM('test-user-123', 'lnc-chair-2025', {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
});
```

Main function to sync poll responses to CiviCRM. This:
1. Fetches responses from SQLite
2. Discovers custom field IDs
3. Creates/finds contact
4. Updates custom fields
5. Applies tags

---

#### `getContactInfoFromResponses(crmContactId: string, surveyId: string)`
```typescript
import { getContactInfoFromResponses } from '@/lib/civicrm/poll-sync';

const info = getContactInfoFromResponses('test-user-123', 'lnc-chair-2025');
// Returns: { firstName: 'John', lastName: 'Doe', email: '...', phone: '...' }
```

Extracts contact info from the contact verification question (Q8).

---

## Environment Variables

Required in `.env.local`:

```env
CIVICRM_API_ENDPOINT=https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/ajax/rest
CIVICRM_SITE_KEY=4JEeMFOoCM781tbK2aQkz00koyx65wMnra3YVjdmI
CIVICRM_API_KEY=7k9mP2xQwN5vL8jR4tY6hF3nB1cV0zAe
```

---

## NPM Scripts

### Test CiviCRM Connection
```bash
npm run test:civicrm
```

Runs the CLI test script to verify:
- API connectivity
- Custom field discovery
- Tag creation

---

## CiviCRM API Calls

The integration uses CiviCRM's REST API v3. All calls go through the `apiCall()` private method:

### Basic Structure
```
GET https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/ajax/rest
  ?key=<SITE_KEY>
  &api_key=<API_KEY>
  &entity=<Entity>
  &action=<Action>
  &json=1
  &<param>=<value>
```

### Common Entities Used

- **Contact** - Create, read, update contact records
- **CustomField** - Discover custom field IDs
- **CustomGroup** - Get custom field groups
- **Tag** - Create and manage tags
- **EntityTag** - Apply tags to contacts

---

## Data Mapping

### Questions → CiviCRM Fields

| Question ID | Type | CiviCRM Field | Format |
|------------|------|---------------|--------|
| lnc-chair-q1 | Multiple choice + Other | custom_34 | "Evan McMahon" |
| lnc-chair-q2 | Multiple choice | custom_35 | "Yes" |
| lnc-chair-q3 | Multiple choice + Other | custom_36 | "Podcast" or "Other (Ron Paul)" |
| lnc-chair-q4 | Multiple select | custom_37 | "Gun Rights, Taxation, Immigration" |
| lnc-chair-q5 | Multiple choice | custom_38 | "Chase Oliver" |
| lnc-chair-q6 | Multiple choice | custom_39 | "5-10 Years" |
| lnc-chair-q7 | Multiple choice | custom_40 | "More/Better Candidates" |
| lnc-chair-q8 | Contact verification | custom_41 | JSON string |
| - | Auto-generated | custom_45 | "2025-01-19" |

### Tag Prefixes

- **Issue:** - Political issues from Q4
- **LNC Chair:** - Chair vote from Q1
- **2024 Vote:** - (Optional, commented out in code)
- **Member Duration:** - (Optional, not implemented)

---

## Error Handling

### Graceful Degradation

If CiviCRM sync fails:
1. Poll is still saved to local SQLite
2. Survey is marked complete
3. Error is logged to console
4. Frontend receives success (with optional warning)
5. Admin can manually re-sync later

### Common Errors

| Error | Meaning | Solution |
|-------|---------|----------|
| "Custom group not found" | Can't find Poll_Responses group | Check group internal name |
| "Cannot determine CiviCRM contact ID" | Invalid contact ID format | Use numeric ID or provide email |
| "HTTP 403: Forbidden" | Authentication failed | Check Site Key and API Key |
| "Connection timeout" | CiviCRM not responding | Check endpoint URL |

---

## Testing Checklist

- [ ] Run `npm run test:civicrm` successfully
- [ ] Visit `/api/civicrm/test-connection` in browser
- [ ] Complete a test poll
- [ ] Verify data appears in CiviCRM custom fields
- [ ] Verify tags are applied to contact
- [ ] Test manual sync with `/api/civicrm/sync-poll`
- [ ] Test error handling (disconnect CiviCRM temporarily)
- [ ] Deploy to production and test again

---

## Quick Example: Complete Flow

```typescript
// 1. User completes survey
// Frontend calls: POST /api/survey/complete

// 2. Server marks complete in SQLite
db.prepare('UPDATE survey_sessions SET completed_at = CURRENT_TIMESTAMP ...').run();

// 3. Get contact info from responses
const contactInfo = getContactInfoFromResponses(crmContactId, surveyId);
// Returns: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }

// 4. Push to CiviCRM
await pushPollToCiviCRM(crmContactId, surveyId, contactInfo);

  // 4a. Discover field IDs
  const fieldMapping = await getCustomFieldMapping();
  // { response_1: 'custom_34', response_2: 'custom_35', ... }

  // 4b. Find or create contact
  const civiContactId = await client.findOrCreateContact({...});
  // Returns: 123

  // 4c. Build custom field data
  const customFieldData = {
    custom_34: 'Evan McMahon',
    custom_35: 'Yes',
    custom_36: 'Podcast',
    custom_37: 'Gun Rights, Taxation',
    // ... etc
  };

  // 4d. Update contact
  await client.updateContactCustomFields(123, customFieldData);

  // 4e. Apply tags
  await client.addTagsToContact(123, ['Issue: Gun Rights', ...]);

// 5. Return success to frontend
return { success: true };
```

---

For more details, see:
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Step-by-step setup
- [CIVICRM_INTEGRATION.md](CIVICRM_INTEGRATION.md) - Technical documentation
