# GToolix Standalone Monitoring Dashboard (`gtoolix-monitoring-site`)

Production-ready, standalone monitoring dashboard web app for GToolix. This project is a **separate deployable repository/site** with its own root directory, designed to be deployed directly to Netlify (e.g. `gtoolix-monitor.netlify.app`).

---

## 📁 Standalone Project Structure

```
gtoolix-monitoring-site/
├── index.html          # Arabic Dashboard UI (noindex, RTL, Cairo font)
├── styles.css          # Self-contained CSS design system (Dark default, Light toggle)
├── config.js           # Supabase URL & anon key placeholders
├── client.js           # Tracking SDK (also served/copied for host site)
├── app.js              # Dashboard logic & RLS gated data fetching
├── schema.sql          # Hardened Postgres schema & RLS policies
├── robots.txt          # Disallow: /  (Blocks indexing of entire standalone site)
├── netlify.toml        # Netlify static site configuration
└── README.md           # Setup, deployment & security validation guide
```

---

## 🚀 Setup & Deployment Instructions

### 1. Database Setup (Supabase)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) -> **SQL Editor**.
2. Copy and execute the contents of [`schema.sql`](file:///c:/Users/Girges/Desktop/toolshub-social-downloader/gtoolix-monitoring-site/schema.sql).
3. Create your admin user in **Authentication** -> **Users**.
4. Promote your user to admin in SQL Editor:
   ```sql
   UPDATE public.profiles SET is_admin = true WHERE email = 'your-admin-email@gtoolix.com';
   ```

### 2. Dashboard Deployment (Netlify)
1. Connect this directory (`gtoolix-monitoring-site/`) to Netlify as a static site.
2. Build command: *(leave empty)*
3. Publish directory: `.`
4. Define your Supabase credentials in `config.js` or via global window environment variables:
   ```javascript
   window.GTOOLIX_SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   window.GTOOLIX_SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
   ```

---

## 🔒 Security Verification & Part F Validation Checklist

Execute the following verification steps before deploying to production:

### 1. Hardened RPC Security Privilege Check
Execute in Supabase SQL Editor:
```sql
SELECT has_function_privilege('anon', 'public.cleanup_old_monitoring_data(integer)', 'EXECUTE');
-- MUST RETURN: false
```

### 2. Anonymous Read REST Check (RLS Enforcement)
Run via cURL:
```bash
curl -X GET 'https://YOUR_PROJECT_ID.supabase.co/rest/v1/sessions?select=*' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
# MUST RETURN: [] (empty array)
```

### 3. Anonymous Write REST Check (Tracking Insertion)
Run via cURL:
```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/rest/v1/page_views' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"visitor_id": "v_test", "path": "/test-path"}'
# MUST RETURN: 201 Created or 204 No Content
```

### 4. Non-Admin Authorization Gating
- Sign in with a user whose `profiles.is_admin` is `false`.
- The dashboard app (`app.js`) queries `profiles.is_admin` prior to rendering any data. It immediately signs out non-admin users and displays an access-denied overlay.

---

## 🌐 Technical Limitations & Disclaimers

- **IP Address & Geolocation**: Client-side JavaScript running in the user's browser has **no access to raw visitor IP addresses**. The client script records `ip_masked: 'anonymized'`.
- **Country Identification & Geolocation**: Country is resolved via a client-side call to `ipapi.co` (with `ipwho.is` as fallback), which reveals the visitor's public IP to that third-party service (the raw IP is not stored in GToolix's database — only the resolved country string, e.g. `'EG'`, is stored).
- **Fallback Mechanism**: If both geolocation service calls fail, time out, or are blocked (e.g., by ad-blockers), the system falls back to browser language (`navigator.language`) prefixed with `lang:` (e.g. `'lang:ar-EG'`), visually flagging estimated entries in stored data.
- **Service Rate Limits**: Note free-tier daily request caps of these services (`ipapi.co`: 1,000 requests/day free; `ipwho.is`: 10,000 requests/month free).

---

## 💾 Supabase Free Tier Data Retention Strategy

Supabase Free tier includes a **500MB database cap**.
- `public.cleanup_old_monitoring_data(30)` purges records older than 30 days.
- Executable via dashboard button by authenticated admins or scheduled via `pg_cron`:
  ```sql
  SELECT cron.schedule('daily-monitoring-cleanup', '0 3 * * *', 'SELECT public.cleanup_old_monitoring_data(30);');
  ```
