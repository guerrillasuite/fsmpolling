# CiviCRM Integration - Quick Start

## 🚀 Test It Now (30 seconds)

```bash
# 1. Test connection
npm run test:civicrm

# 2. Start dev server
npm run dev

# 3. Complete a test poll
# Visit: http://localhost:3001/survey/lnc-chair-2025?contact_id=test-user-1
```

## ✅ What You Should See

### In Console
```
✅ Connection successful!
✅ Found custom field group "Poll_Responses" with 11 fields
✅ All expected fields are present!

✓ Updated CiviCRM contact 123 with poll responses
✓ Applied 3 tags to contact 123
```

### In CiviCRM
1. Contact created/updated with email from Q8
2. Custom fields "Response 1" through "Response 10" populated
3. Tags applied (e.g., "Issue: Gun Rights", "LNC Chair: Evan McMahon")

## 📋 Pre-Flight Checklist

- [x] `.env.local` exists with your API credentials
- [ ] Run `npm run test:civicrm` successfully
- [ ] Complete a test poll
- [ ] Verify data in CiviCRM

## 🔧 If Something's Wrong

### Test script fails
```bash
# Check credentials
cat .env.local

# Should show:
# CIVICRM_API_ENDPOINT=https://polling.freespeechmedia.xyz/...
# CIVICRM_SITE_KEY=4JEe...
# CIVICRM_API_KEY=7k9m...
```

### "Custom group not found"
In CiviCRM, verify:
- Group name: "Poll Responses"
- Internal name: `Poll_Responses` (with underscore!)

### No data in CiviCRM after poll
Check browser console and server logs for errors

## 📚 Full Documentation

- **`INTEGRATION_SUMMARY.md`** - What was built (start here!)
- **`SETUP_GUIDE.md`** - Detailed setup steps
- **`API_REFERENCE.md`** - Code reference
- **`CIVICRM_INTEGRATION.md`** - Technical details

## 🚢 Deploy to Production

1. Add env vars to Railway/Vercel:
   ```
   CIVICRM_API_ENDPOINT=https://polling.freespeechmedia.xyz/?page=CiviCRM&q=civicrm/ajax/rest
   CIVICRM_SITE_KEY=4JEeMFOoCM781tbK2aQkz00koyx65wMnra3YVjdmI
   CIVICRM_API_KEY=7k9mP2xQwN5vL8jR4tY6hF3nB1cV0zAe
   ```

2. Push to Git:
   ```bash
   git add .
   git commit -m "Add CiviCRM integration"
   git push
   ```

3. Test on production:
   ```
   https://polling.freespeechmedia.live/api/civicrm/test-connection
   ```

## 🛠️ Useful Commands

```bash
# Test CiviCRM connection
npm run test:civicrm

# Start dev server
npm run dev

# Build for production
npm run build

# Manual sync a poll (if sync failed)
curl -X POST http://localhost:3001/api/civicrm/sync-poll \
  -H "Content-Type: application/json" \
  -d '{"crm_contact_id": "test-user-1", "survey_id": "lnc-chair-2025"}'
```

## ℹ️ How It Works

1. User completes poll → saved to SQLite
2. Poll marked complete → triggers CiviCRM sync
3. Contact found/created by email (from Q8)
4. Responses mapped to custom fields (Response 1-10)
5. Tags applied based on answers

**Fault tolerant:** If CiviCRM fails, poll still saves locally!

## 🆘 Need Help?

1. Read `INTEGRATION_SUMMARY.md` for overview
2. Check `SETUP_GUIDE.md` for troubleshooting
3. Run `npm run test:civicrm` to diagnose issues
4. Check server console logs for error messages
