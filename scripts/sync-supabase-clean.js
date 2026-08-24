const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xucvfzpoeaeabbdmghdj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Y3ZmenBvZWFlYWJiZG1naGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzU4NTAsImV4cCI6MjEwMTYxMTg1MH0.rgd2FjES6Jm535Xw4vQpzQIZRPKk9NzMi2bt9A4reSo';

function makeSupabaseRequest(endpoint, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
        const options = {
            method: method,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', (err) => reject(err));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    console.log('--- Cleaning Gemini from Remote Supabase Database ---');
    try {
        // Attempt DELETE
        const delRes = await makeSupabaseRequest('tools?slug=eq.gemini-watermark-remover', 'DELETE');
        console.log('DELETE response status:', delRes.status, delRes.data);
    } catch (e) {
        console.warn('DELETE error, attempting PATCH unpublish:', e.message);
    }

    try {
        // Attempt PATCH is_published = false
        const patchRes = await makeSupabaseRequest('tools?slug=eq.gemini-watermark-remover', 'PATCH', { is_published: false });
        console.log('PATCH response status:', patchRes.status, patchRes.data);
    } catch (e) {
        console.warn('PATCH error:', e.message);
    }
}

run();
