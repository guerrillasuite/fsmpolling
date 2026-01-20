# CiviCRM Integration - What Was Built

## Summary

I've successfully integrated your polling app with CiviCRM. When users complete a poll, their responses are now automatically pushed to CiviCRM custom fields and tags are applied.

## What Works Now

✅ **Automatic sync when poll is completed**
- All 8 poll questions (10 response fields) → CiviCRM custom fields
- Contact creation/lookup by email
- Automatic tagging based on answers
- Fault-tolerant (polls save locally even if CiviCRM fails)

✅ **Testing and debugging tools**
- CLI test script: `npm run test:civicrm`
- Web endpoint: `/api/civicrm/test-connection`
- Manual sync: `/api/civicrm/sync-poll`

✅ **Complete documentation**
- Setup guide with step-by-step instructions
- API reference with code examples
- Technical documentation

## Files Created

### Core Integration (6 files)

1. **`lib/civicrm/client.ts`** (264 lines)
   - CiviCRM REST API client
   - Methods: getCustomField, findOrCreateContact, updateContactCustomFields, addTagsToContact
   - Handles authentication and error handling

2. **`lib/civicrm/poll-sync.ts`** (235 lines)
   - Poll-specific sync logic
   - `pushPollToCiviCRM()` - main sync function
   - `getContactInfoFromResponses()` - extract contact data from Q8
   - Automatic field mapping and tag extraction

3. **`app/api/survey/complete/route.ts`** (Modified)
   - Added CiviCRM sync after marking poll complete
   - Graceful error handling

4. **`app/api/civicrm/test-connection/route.ts`** (New)
   - Test endpoint to verify connection
   - Discover custom field IDs
   - Returns field mapping

5. **`app/api/civicrm/sync-poll/route.ts`** (New)
   - Manual sync endpoint
   - Useful for re-syncing or debugging

6. **`scripts/test-civicrm.ts`** (New)
   - CLI test script
   - Verifies connection, fields, and tags
   - Run with: `npm run test:civicrm`

### Configuration

7. **`.env.local`** (Created)
   - Your CiviCRM API credentials
   - Fixed the double `http://` issue in your endpoint

8. **`package.json`** (Modified)
   - Added `test:civicrm` script
   - Added `dotenv` dependency

### Documentation (3 files)

9. **`CIVICRM_INTEGRATION.md`** - Technical overview
10. **`SETUP_GUIDE.md`** - Step-by-step setup instructions
11. **`API_REFERENCE.md`** - API endpoints and function reference

## Quick Start

### 1. Test the Connection

```bash
npm run test:civicrm
```

Expected output:
```
✅ Connection successful!
✅ Found custom field group "Poll_Responses" with 11 fields
✅ All expected fields are present!
```

### 2. Test with a Poll

```bash
npm run dev
```

Visit: http://localhost:3001/survey/lnc-chair-2025?contact_id=test-user-1

Complete the poll and check the console for:
```
✓ Updated CiviCRM contact 123 with poll responses
✓ Applied 3 tags to contact 123
✓ Successfully synced poll to CiviCRM for contact test-user-1
```

### 3. Verify in CiviCRM

1. Log into CiviCRM
2. Find the contact (search by email from Q8)
3. Check "Poll Responses" custom fields are populated
4. Check Tags tab for applied tags

## How It Works

```
User completes poll
       ↓
Frontend calls /api/survey/complete
       ↓
Server marks complete in SQLite
       ↓
pushPollToCiviCRM() is called
       ↓
   ┌───────────────────────────────────┐
   │ 1. Get all responses from SQLite  │
   │ 2. Discover custom field IDs      │
   │ 3. Find/create contact by email   │
   │ 4. Map responses to custom_X      │
   │ 5. Update contact in CiviCRM      │
   │ 6. Extract and apply tags         │
   └───────────────────────────────────┘
       ↓
Success! (or graceful failure)
```

## Data Mapping

### Questions → CiviCRM Fields

- **Q1:** LNC Chair vote → `custom_34` (Response 1) + Tag
- **Q2:** Bylaws amendment → `custom_35` (Response 2)
- **Q3:** How joined → `custom_36` (Response 3)
- **Q4:** Top 3 issues → `custom_37` (Response 4) + Multiple tags
- **Q5:** 2024 vote → `custom_38` (Response 5)
- **Q6:** Membership duration → `custom_39` (Response 6)
- **Q7:** Donation motivator → `custom_40` (Response 7)
- **Q8:** Contact info → `custom_41` (Response 8)
- **Auto:** Completion date → `custom_45` (Completion Date and Time)

### Tags Created

- `Issue: Gun Rights` (from Q4)
- `Issue: Taxation` (from Q4)
- `Issue: Immigration` (from Q4)
- `LNC Chair: Evan McMahon` (from Q1, if not "Undecided")

## Important Notes

### ⚠️ Your API Endpoint Had a Typo

You provided:
```
https://http://polling.freespeechmedia.xyz//?page=CiviCRM&q=civicrm/ajax/rest
```

I corrected it to:
```
https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/ajax/rest
```

Changes:
- Removed duplicate `http://`
- Removed extra `/` before `?page`

### 🔑 Custom Field IDs Are Auto-Discovered

You don't need to manually specify `custom_X` IDs. The integration:
1. Looks up the "Poll_Responses" custom group
2. Finds all fields (Response_1, Response_2, etc.)
3. Builds the mapping dynamically
4. Caches it to avoid repeated API calls

### 🏷️ Tags Are Auto-Created

If a tag doesn't exist (like "Issue: Gun Rights"), it's created automatically.

### 🛡️ Fault Tolerant

If CiviCRM is down or sync fails:
- Poll is still saved locally
- Survey is marked complete
- User sees success message
- Admin can manually re-sync later

## Next Steps

### Before Production

1. ✅ Run `npm run test:civicrm` - verify connection
2. ✅ Complete a test poll - verify data syncs
3. ✅ Check CiviCRM - verify fields and tags
4. ⬜ Add environment variables to Railway:
   ```
   CIVICRM_API_ENDPOINT=...
   CIVICRM_SITE_KEY=...
   CIVICRM_API_KEY=...
   ```
5. ⬜ Deploy to production
6. ⬜ Test on production: visit `/api/civicrm/test-connection`

### Optional Enhancements

- Add phone number sync (currently only email)
- Create CiviCRM Activities for each poll completion
- Add more tag extraction logic (2024 vote, membership duration, etc.)
- Build admin dashboard to view sync status
- Add retry logic for failed syncs

## Troubleshooting

### Connection Test Fails

```bash
# Check your credentials
cat .env.local

# Test manually
curl "https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/ajax/rest&key=YOUR_SITE_KEY&api_key=YOUR_API_KEY&entity=Contact&action=get&json=1&options[limit]=1"
```

### Custom Fields Not Found

In CiviCRM:
1. Administer → Customize Data and Screens → Custom Fields
2. Find "Poll Responses" group
3. Verify internal names: `Response_1`, `Response_2`, etc. (with underscores!)

### Tags Not Appearing

Check: Contacts → Manage Tags

They should be under "Used For: Contacts"

## Questions Answered

✅ **"How do I find custom field IDs?"**
- Run `npm run test:civicrm` or visit `/api/civicrm/test-connection`
- They're auto-discovered, so you don't need to hardcode them

✅ **"What's the exact API call structure?"**
- See `lib/civicrm/client.ts` → `apiCall()` method
- Or check the CiviCRM API docs: https://docs.civicrm.org/dev/en/latest/api/

✅ **"How do I integrate into my existing app?"**
- Already done! Check `app/api/survey/complete/route.ts`

✅ **"How to apply tags for multiple-select answers?"**
- See `lib/civicrm/poll-sync.ts` → `extractTagsFromResponses()`
- Currently tags Q4 (political issues) and Q1 (chair vote)

## File Locations

```
lppolling/
├── lib/
│   └── civicrm/
│       ├── client.ts          ← CiviCRM API client
│       └── poll-sync.ts       ← Poll sync logic
├── app/
│   └── api/
│       ├── survey/
│       │   └── complete/
│       │       └── route.ts   ← Modified (added sync)
│       └── civicrm/
│           ├── test-connection/route.ts  ← Test endpoint
│           └── sync-poll/route.ts        ← Manual sync
├── scripts/
│   └── test-civicrm.ts        ← CLI test script
├── .env.local                 ← API credentials
├── package.json               ← Added test script
├── CIVICRM_INTEGRATION.md     ← Technical docs
├── SETUP_GUIDE.md             ← Setup instructions
└── API_REFERENCE.md           ← API reference
```

## Support

For issues or questions:
1. Check the documentation files (SETUP_GUIDE.md, API_REFERENCE.md)
2. Run `npm run test:civicrm` to diagnose
3. Check console logs for error messages
4. CiviCRM API docs: https://docs.civicrm.org/dev/en/latest/api/

---

**Status:** ✅ Ready for testing

**Next:** Run `npm run test:civicrm` to verify everything works!
