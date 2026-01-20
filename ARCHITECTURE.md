# CiviCRM Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│  (http://localhost:3001/survey/lnc-chair-2025?contact_id=...)  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ [User answers questions]
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Frontend: SurveyContainer.tsx                      │
│  - Displays questions one at a time                             │
│  - Saves each answer immediately via /api/survey/response       │
│  - Submits completed survey via /api/survey/complete            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ POST /api/survey/complete
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│        Backend: app/api/survey/complete/route.ts                │
│                                                                  │
│  1. Mark survey complete in SQLite                              │
│  2. Get contact info from Question 8                            │
│  3. Call pushPollToCiviCRM()                                    │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ pushPollToCiviCRM()
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              lib/civicrm/poll-sync.ts                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Step 1: Get responses from SQLite                        │  │
│  │   SELECT * FROM responses WHERE contact_id = ? ...       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Step 2: Discover custom field IDs                        │  │
│  │   getCustomFieldMapping()                                │  │
│  │   Returns: { response_1: 'custom_34', ... }              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Step 3: Find or create contact                           │  │
│  │   client.findOrCreateContact({ email: '...' })           │  │
│  │   Returns: CiviCRM contact ID (e.g., 123)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Step 4: Format responses                                 │  │
│  │   "Gun Rights, Taxation" → custom_37                     │  │
│  │   "Evan McMahon" → custom_34                             │  │
│  │   "2025-01-19" → custom_45                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Step 5: Update contact custom fields                     │  │
│  │   client.updateContactCustomFields(123, {...})           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Step 6: Extract and apply tags                           │  │
│  │   extractTagsFromResponses()                             │  │
│  │   client.addTagsToContact(123, ['Issue: Gun Rights'])    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Multiple REST API calls
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     lib/civicrm/client.ts                       │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ getCustomField │  │ findOrCreate   │  │ addTagsTo      │   │
│  │ sByGroup()     │  │ Contact()      │  │ Contact()      │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│            │                 │                    │             │
│            └─────────────────┼────────────────────┘             │
│                              │                                  │
│                              ▼                                  │
│                     ┌────────────────┐                          │
│                     │  apiCall()     │                          │
│                     │  (private)     │                          │
│                     └────────────────┘                          │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               │ HTTPS REST API
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CiviCRM API                              │
│  https://polling.freespeechmedia.xyz/?page=CiviCRM&...          │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ Contact API   │  │ CustomField   │  │ Tag API       │      │
│  │               │  │ API           │  │               │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                  │
│                    WordPress + CiviCRM                          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### User completes poll with these answers:

```
Q1: LNC Chair vote          → "Evan McMahon"
Q2: Bylaws amendment        → "Yes"
Q3: How joined              → "Podcast"
Q4: Top 3 issues            → ["Gun Rights", "Taxation", "Immigration"]
Q5: 2024 vote              → "Chase Oliver"
Q6: Membership duration     → "5-10 Years"
Q7: Donation motivator      → "More/Better Candidates"
Q8: Contact verification    → { email: "john@example.com", ... }
```

### Processing Steps:

```
1. LOCAL DATABASE (SQLite)
   ┌─────────────────────────────────────────────┐
   │ responses table:                            │
   │ - crm_contact_id: "test-user-1"            │
   │ - survey_id: "lnc-chair-2025"              │
   │ - question_id: "lnc-chair-q1"              │
   │ - answer_value: "Evan McMahon"             │
   │ ... (8 more rows)                          │
   └─────────────────────────────────────────────┘

2. CUSTOM FIELD DISCOVERY
   ┌─────────────────────────────────────────────┐
   │ CiviCRM API: GET CustomField?group=Poll...  │
   │ Returns:                                     │
   │ {                                           │
   │   Response_1: { id: 34 },                  │
   │   Response_2: { id: 35 },                  │
   │   ...                                       │
   │   Completion_Date_and_Time: { id: 45 }     │
   │ }                                           │
   └─────────────────────────────────────────────┘

3. CONTACT LOOKUP/CREATE
   ┌─────────────────────────────────────────────┐
   │ CiviCRM API: GET Contact?email=john@...     │
   │ → Found: contact_id = 123                   │
   │   OR                                        │
   │ CiviCRM API: CREATE Contact                 │
   │ → Created: contact_id = 456                 │
   └─────────────────────────────────────────────┘

4. BUILD CUSTOM FIELD DATA
   ┌─────────────────────────────────────────────┐
   │ {                                           │
   │   custom_34: "Evan McMahon",               │
   │   custom_35: "Yes",                        │
   │   custom_36: "Podcast",                    │
   │   custom_37: "Gun Rights, Taxation, ...",  │
   │   custom_38: "Chase Oliver",               │
   │   custom_39: "5-10 Years",                 │
   │   custom_40: "More/Better Candidates",     │
   │   custom_41: "{\"email\":\"john@...\"}",   │
   │   custom_45: "2025-01-19"                  │
   │ }                                           │
   └─────────────────────────────────────────────┘

5. UPDATE CONTACT
   ┌─────────────────────────────────────────────┐
   │ CiviCRM API: UPDATE Contact                 │
   │ POST Contact/create?id=123&custom_34=...    │
   └─────────────────────────────────────────────┘

6. APPLY TAGS
   ┌─────────────────────────────────────────────┐
   │ Tags to create/apply:                       │
   │ - "Issue: Gun Rights"                      │
   │ - "Issue: Taxation"                        │
   │ - "Issue: Immigration"                     │
   │ - "LNC Chair: Evan McMahon"                │
   │                                             │
   │ For each tag:                               │
   │   1. GET Tag?name=...                       │
   │   2. If not found: CREATE Tag               │
   │   3. CREATE EntityTag (tag → contact)       │
   └─────────────────────────────────────────────┘
```

## Component Responsibilities

### Frontend (`SurveyContainer.tsx`)
- Render questions
- Handle user input
- Save answers immediately (one at a time)
- Trigger completion

### API Routes
- **`/api/survey/response`** - Save individual answers to SQLite
- **`/api/survey/complete`** - Mark complete + trigger CiviCRM sync
- **`/api/civicrm/test-connection`** - Test endpoint for debugging
- **`/api/civicrm/sync-poll`** - Manual sync endpoint

### CiviCRM Client (`lib/civicrm/client.ts`)
- Low-level CiviCRM REST API wrapper
- Authentication handling
- Generic CRUD operations
- Error handling

### Poll Sync (`lib/civicrm/poll-sync.ts`)
- High-level poll-specific logic
- Response formatting
- Tag extraction
- Orchestrates the sync process

## Error Handling Flow

```
┌───────────────────────────────────────────────────────────┐
│ User submits poll                                         │
└─────────────────────────┬─────────────────────────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │ Save to SQLite   │
                │ ✓ Always works   │
                └─────────┬────────┘
                          │
                          ▼
                ┌──────────────────┐
                │ Push to CiviCRM  │
                └─────────┬────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
        ┌──────────────┐    ┌──────────────┐
        │   Success    │    │   Failure    │
        └──────┬───────┘    └──────┬───────┘
               │                   │
               ▼                   ▼
        ┌──────────────┐    ┌──────────────────┐
        │ Return       │    │ Log error        │
        │ success      │    │ Return success   │
        │              │    │ (with warning)   │
        └──────────────┘    └──────┬───────────┘
                                   │
                                   ▼
                            ┌──────────────────┐
                            │ Admin can        │
                            │ manually re-sync │
                            │ later via        │
                            │ /sync-poll       │
                            └──────────────────┘
```

## File Structure

```
lppolling/
│
├── lib/
│   ├── db/
│   │   └── init.ts                    ← SQLite database setup
│   └── civicrm/
│       ├── client.ts                  ← CiviCRM REST API client
│       └── poll-sync.ts               ← Poll-specific sync logic
│
├── app/
│   ├── components/
│   │   └── survey/
│   │       └── SurveyContainer.tsx    ← Frontend survey UI
│   └── api/
│       ├── survey/
│       │   ├── response/route.ts      ← Save individual answers
│       │   └── complete/route.ts      ← Complete + CiviCRM sync ⭐
│       └── civicrm/
│           ├── test-connection/route.ts  ← Test endpoint
│           └── sync-poll/route.ts        ← Manual sync
│
├── scripts/
│   └── test-civicrm.ts                ← CLI test script
│
├── .env.local                         ← API credentials (not in git!)
│
└── Documentation/
    ├── QUICK_START.md                 ← Start here!
    ├── INTEGRATION_SUMMARY.md         ← What was built
    ├── SETUP_GUIDE.md                 ← Detailed setup
    ├── API_REFERENCE.md               ← Code reference
    ├── CIVICRM_INTEGRATION.md         ← Technical details
    └── ARCHITECTURE.md                ← This file
```

## Security Considerations

1. **API Credentials**
   - Stored in `.env.local` (not committed to git)
   - Never exposed to frontend
   - Used only server-side

2. **Authentication**
   - CiviCRM uses Site Key + API Key
   - All requests over HTTPS
   - Keys validated on every request

3. **Data Validation**
   - User input sanitized before SQLite storage
   - Contact lookup prevents duplicates
   - Failed syncs don't expose errors to users

## Performance Considerations

1. **Custom Field Caching**
   - Field IDs cached after first lookup
   - Avoids repeated API calls

2. **Immediate Answer Saving**
   - Answers saved one at a time
   - Prevents data loss if user closes browser

3. **Async Sync**
   - CiviCRM sync happens after SQLite save
   - User doesn't wait for CiviCRM response
   - Failed syncs don't block completion

## Scalability

Current implementation is suitable for:
- 100s of concurrent users ✅
- 1000s of poll responses ✅
- Multiple surveys ✅

For higher scale, consider:
- Background job queue for CiviCRM syncs
- Batch syncing instead of per-poll
- Redis caching for field mappings
- Connection pooling

## Testing Strategy

1. **Unit Tests** (not yet implemented)
   - Test individual functions
   - Mock CiviCRM API calls

2. **Integration Tests**
   - CLI test script (`npm run test:civicrm`)
   - Test endpoint (`/api/civicrm/test-connection`)

3. **Manual Testing**
   - Complete actual polls
   - Verify data in CiviCRM
   - Test error scenarios

## Monitoring & Debugging

### Server Logs
```
✓ Updated CiviCRM contact 123 with poll responses
✓ Applied 3 tags to contact 123
✓ Successfully synced poll to CiviCRM for contact test-user-1
```

### Browser Endpoints
- `/api/civicrm/test-connection` - Live diagnostics
- Check custom field IDs
- Verify connection

### Manual Sync
- Re-sync failed polls via `/api/civicrm/sync-poll`
- Useful for debugging

## Future Enhancements

### Possible Additions
- [ ] Admin dashboard for sync status
- [ ] Retry logic for failed syncs
- [ ] Webhook notifications on completion
- [ ] CiviCRM Activities (not just custom fields)
- [ ] Bulk export to CiviCRM
- [ ] Real-time sync status in frontend
- [ ] Phone number sync
- [ ] Address sync
- [ ] Custom field validation

### Not Currently Implemented
- ❌ Activities (only custom fields + tags)
- ❌ Phone number sync
- ❌ Duplicate detection (beyond email)
- ❌ Retry on failure
- ❌ Sync status tracking
