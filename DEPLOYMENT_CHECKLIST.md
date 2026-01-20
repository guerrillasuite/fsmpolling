# CiviCRM Integration - Deployment Checklist

## Pre-Deployment Testing

### ✅ Local Testing

- [ ] **Test CiviCRM connection**
  ```bash
  npm run test:civicrm
  ```
  Expected: ✅ All green checkmarks

- [ ] **Complete a test poll**
  ```bash
  npm run dev
  # Visit: http://localhost:3001/survey/lnc-chair-2025?contact_id=test-user-1
  ```
  Expected: Poll completes successfully

- [ ] **Verify in CiviCRM**
  - [ ] Contact created/updated
  - [ ] Custom fields populated (Response 1-10)
  - [ ] Completion date set
  - [ ] Tags applied

- [ ] **Check console logs**
  ```
  ✓ Updated CiviCRM contact X with poll responses
  ✓ Applied X tags to contact Y
  ✓ Successfully synced poll to CiviCRM for contact Z
  ```

- [ ] **Test error handling**
  - [ ] Temporarily break CiviCRM credentials
  - [ ] Complete a poll
  - [ ] Verify poll still saves locally
  - [ ] Restore credentials
  - [ ] Manually re-sync via `/api/civicrm/sync-poll`

### ✅ Build Verification

- [ ] **Build succeeds**
  ```bash
  npm run build
  ```
  Expected: ✓ Compiled successfully

- [ ] **No TypeScript errors**
  Check build output for red errors (warnings are OK)

## CiviCRM Configuration

### ✅ Custom Fields Setup

- [ ] **Custom group exists**
  - Name: "Poll Responses"
  - Internal name: `Poll_Responses`
  - Used for: Contacts - Individuals

- [ ] **All fields present**
  - [ ] Response 1 (`Response_1`)
  - [ ] Response 2 (`Response_2`)
  - [ ] Response 3 (`Response_3`)
  - [ ] Response 4 (`Response_4`)
  - [ ] Response 5 (`Response_5`)
  - [ ] Response 6 (`Response_6`)
  - [ ] Response 7 (`Response_7`)
  - [ ] Response 8 (`Response_8`)
  - [ ] Response 9 (`Response_9`)
  - [ ] Response 10 (`Response_10`)
  - [ ] Completion Date and Time (`Completion_Date_and_Time`)

- [ ] **Field IDs discovered**
  Run: `npm run test:civicrm`
  or visit: `/api/civicrm/test-connection`

### ✅ API Credentials

- [ ] **Site Key verified**
  Current: `4JEeMFOoCM781tbK2aQkz00koyx65wMnra3YVjdmI`

- [ ] **API Key verified**
  Current: `7k9mP2xQwN5vL8jR4tY6hF3nB1cV0zAe`

- [ ] **API Endpoint correct**
  Current: `https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/ajax/rest`
  ⚠️ Note: Fixed from `https://http://...`

- [ ] **API user has permissions**
  - Create/edit contacts
  - Read/write custom fields
  - Create/manage tags

## Production Deployment

### ✅ Environment Variables

Add to Railway (or your hosting platform):

```bash
CIVICRM_API_ENDPOINT=https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/ajax/rest
CIVICRM_SITE_KEY=4JEeMFOoCM781tbK2aQkz00koyx65wMnra3YVjdmI
CIVICRM_API_KEY=7k9mP2xQwN5vL8jR4tY6hF3nB1cV0zAe
```

- [ ] Variables added to hosting platform
- [ ] Variables saved/deployed

### ✅ Git & Deployment

- [ ] **Review changes**
  ```bash
  git status
  git diff
  ```

- [ ] **Commit changes**
  ```bash
  git add .
  git commit -m "Add CiviCRM integration for poll responses"
  ```

- [ ] **Push to remote**
  ```bash
  git push origin main
  ```

- [ ] **Verify deployment**
  - Railway/Vercel automatically deploys
  - Check deployment logs for errors

### ✅ Production Testing

- [ ] **Test connection endpoint**
  Visit: `https://polling.freespeechmedia.live/api/civicrm/test-connection`
  Expected: JSON with field mapping

- [ ] **Complete a real poll**
  Visit: `https://polling.freespeechmedia.live/survey/lnc-chair-2025?contact_id=prod-test-1`

- [ ] **Verify in CiviCRM**
  - [ ] Contact exists
  - [ ] Fields populated
  - [ ] Tags applied

- [ ] **Check production logs**
  Look for sync success messages

## Post-Deployment Monitoring

### ✅ First Week

- [ ] Monitor error logs daily
- [ ] Check CiviCRM for data quality
- [ ] Verify all polls are syncing
- [ ] Collect user feedback

### ✅ Metrics to Track

- [ ] Total polls completed
- [ ] Successful CiviCRM syncs
- [ ] Failed syncs (if any)
- [ ] Most common tags
- [ ] Contact creation vs. updates

### ✅ Support Preparation

- [ ] Bookmark documentation:
  - [ ] `QUICK_START.md` - Quick reference
  - [ ] `SETUP_GUIDE.md` - Troubleshooting
  - [ ] `API_REFERENCE.md` - Code reference

- [ ] Save manual sync command:
  ```bash
  curl -X POST https://polling.freespeechmedia.live/api/civicrm/sync-poll \
    -H "Content-Type: application/json" \
    -d '{"crm_contact_id": "CONTACT_ID", "survey_id": "lnc-chair-2025"}'
  ```

## Security Checklist

- [ ] **`.env.local` not in git**
  ```bash
  git ls-files | grep .env.local
  # Should return nothing
  ```

- [ ] **Credentials secured**
  - Not in source code
  - Not in client-side code
  - Only in environment variables

- [ ] **HTTPS enforced**
  - CiviCRM endpoint uses HTTPS
  - Production app uses HTTPS

- [ ] **API permissions minimal**
  - CiviCRM API user has only necessary permissions
  - No admin access needed

## Rollback Plan

If something goes wrong:

### Option 1: Disable CiviCRM Sync

1. Remove environment variables from hosting platform
2. App will continue working (polls save locally)
3. CiviCRM sync will be skipped
4. Fix issues offline

### Option 2: Revert Code

1. ```bash
   git revert HEAD
   git push
   ```
2. Deployment will roll back to previous version

### Option 3: Manual Sync Later

1. Keep integration code
2. Let polls save to SQLite
3. Bulk re-sync later using `/api/civicrm/sync-poll`

## Success Criteria

### Minimum Viable

- [x] Build completes without errors
- [ ] Test poll syncs to CiviCRM
- [ ] Custom fields populate correctly
- [ ] Tags are created and applied

### Ideal

- [ ] 100% of polls sync successfully
- [ ] No performance degradation
- [ ] CiviCRM data quality high
- [ ] Error handling works as expected

## Common Issues & Solutions

### Issue: "Custom group not found"

**Fix:**
1. Check CiviCRM custom group internal name
2. Should be `Poll_Responses` (underscore, not space)

### Issue: "Connection timeout"

**Fix:**
1. Verify CiviCRM endpoint URL
2. Test manually:
   ```bash
   curl "https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/ajax/rest&key=SITE_KEY&api_key=API_KEY&entity=Contact&action=get&json=1&options[limit]=1"
   ```

### Issue: "HTTP 403: Forbidden"

**Fix:**
1. Verify Site Key and API Key
2. Check API user permissions in CiviCRM
3. Ensure REST API is enabled

### Issue: Tags not appearing

**Fix:**
1. Go to CiviCRM: Contacts → Manage Tags
2. Filter by "Used For: Contacts"
3. Tags are auto-created, so check console logs if missing

### Issue: Duplicate contacts

**Fix:**
1. Integration finds by email (from Q8)
2. If email doesn't match, new contact created
3. Consider CiviCRM duplicate detection rules

## Post-Deployment Tasks

### Week 1
- [ ] Monitor error logs
- [ ] Review sync success rate
- [ ] Check data quality in CiviCRM
- [ ] Gather user feedback

### Week 2-4
- [ ] Analyze tag distribution
- [ ] Review contact creation vs. update ratio
- [ ] Optimize if needed
- [ ] Document any issues found

### Month 2+
- [ ] Consider enhancements:
  - [ ] Phone number sync
  - [ ] CiviCRM Activities
  - [ ] Admin dashboard
  - [ ] Bulk re-sync tools

## Documentation Links

Quick access to all docs:

- **[QUICK_START.md](QUICK_START.md)** - 30-second test guide
- **[INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)** - What was built
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup & troubleshooting
- **[API_REFERENCE.md](API_REFERENCE.md)** - Code reference
- **[CIVICRM_INTEGRATION.md](CIVICRM_INTEGRATION.md)** - Technical details
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture

## Sign-Off

Deployment completed by: ________________

Date: ________________

Production URL: https://polling.freespeechmedia.live

Test connection: https://polling.freespeechmedia.live/api/civicrm/test-connection

Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
