# GToolix Monitoring Module — Integration & Deployment Guide

This module provides a production-ready, Arabic-first monitoring dashboard for GToolix integrated with Supabase Free Tier.

---

## Folder Structure

```
/
├── robots.txt                           # Contains Disallow: /monitoring/
├── monitoring/                          # Isolated Monitoring Module
│   ├── index.html                       # Dashboard UI (Arabic, dark/light theme, noindex)
│   ├── monitoring.css                   # Dashboard specific styling (consumes main.css tokens)
│   ├── config.js                        # Supabase credentials & settings
│   ├── client.js                        # Lightweight, fail-safe tracking SDK
│   ├── monitoring-app.js                # Dashboard application logic & Realtime listeners
│   ├── schema.sql                       # Complete PostgreSQL Schema & RLS Policies
│   └── README.md                        # Documentation & Deployment Guide
```

---

## 1. Setup Instructions (Supabase)

### Step 1: Execute SQL Schema & RLS Policies
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to the **SQL Editor**.
3. Copy the entire contents of [`monitoring/schema.sql`](file:///c:/Users/Girges/Desktop/toolshub-social-downloader/monitoring/schema.sql) and paste it into the editor.
4. Click **Run**. This will create the required tables (`profiles`, `sessions`, `page_views`, `tool_usage`, `errors`, `feedback`, `notifications`, `health_checks`), indexes, helper functions, and RLS policies.

### Step 2: Configure Environment Credentials
Open `monitoring/config.js` or define global window properties before script execution:
```javascript
window.GTOOLIX_SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
window.GTOOLIX_SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### Step 3: Create Admin User
1. Go to Supabase Dashboard -> **Authentication** -> **Users**.
2. Click **Add User** -> **Create User** (or sign up via email/password).
3. Open **SQL Editor** and promote the user to admin:
```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'admin@gtoolix.com';
```

---

## 2. Integration Guide for Host Pages

To track pageviews, errors, and tool usage across GToolix, include the following scripts at the bottom of host pages before `</body>`:

```html
<script src="/monitoring/config.js"></script>
<script src="/monitoring/client.js"></script>
```

### Tracking API Examples

`client.js` automatically initializes session tracking and captures page views and uncaught errors. You can also trigger custom tracking anywhere in your JS code:

```javascript
// Track page view explicitly
window.GToolixMonitor.trackPageView('/tools/qr');

// Track tool usage
window.GToolixMonitor.trackToolUsage('QR_Generator', { format: 'png', size: 300 });

// Track caught error
try {
    // operation
} catch (err) {
    window.GToolixMonitor.trackError(err, { component: 'GeminiWatermarkRemover' });
}

// Track custom event
window.GToolixMonitor.trackEvent('download_thumbnail', { resolution: '4K' });
```

---

## 3. Privacy & IP Anonymization

- **No Raw IP Storage**: Raw IP addresses are **never stored** in plain form in the database. IPs are masked (`anonymized` or `192.168.1.xxx`) at client side before dispatching requests.
- **Location Resolution**: Country info relies on client `navigator.language` or edge gateway headers without storing identifiable user data.
- **Search Engine Blocking**: `monitoring/index.html` includes `<meta name="robots" content="noindex, nofollow">` and `robots.txt` disallows `/monitoring/`.

---

## 4. Supabase Free Tier Safety & Data Retention Plan

The Supabase Free tier provides a **500MB database storage limit** and limited concurrent realtime connections.

### Strategy:
1. **Automatic Purge Function**: The SQL schema includes `public.cleanup_old_monitoring_data(p_days INT)` which deletes tracking logs older than 30 days.
2. **Dashboard One-Click Purge**: Admins can trigger manual cleanup anytime directly from the dashboard under **حالة قاعدة البيانات**.
3. **Scheduled Cleanup (pg_cron)**: If Supabase `pg_cron` extension is enabled, schedule daily execution:
```sql
SELECT cron.schedule('daily-monitoring-cleanup', '0 3 * * *', 'SELECT public.cleanup_old_monitoring_data(30);');
```
