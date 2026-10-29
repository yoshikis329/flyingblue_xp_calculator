const allowedOrigin = 'https://yoshikis329.github.io';
const xpCategories = new Set(['Domestic', 'Medium', 'Long 1', 'Long 2', 'Long 3']);

const jsonResponse = (body, status, origin) => new Response(JSON.stringify(body), {
    status,
    headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json; charset=utf-8',
        'Vary': 'Origin'
    }
});

export default {
    async fetch(request) {
        const requestOrigin = request.headers.get('Origin');
        const responseOrigin = requestOrigin === allowedOrigin ? allowedOrigin : 'null';

        if (requestOrigin !== allowedOrigin) {
            return jsonResponse({ error: 'Origin not allowed' }, 403, responseOrigin);
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': responseOrigin,
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400',
                    'Vary': 'Origin'
                }
            });
        }

        if (request.method !== 'GET') {
            return jsonResponse({ error: 'Method not allowed' }, 405, responseOrigin);
        }

        const requestUrl = new URL(request.url);
        const origin = requestUrl.searchParams.get('origin')?.toUpperCase();
        const destination = requestUrl.searchParams.get('destination')?.toUpperCase();
        if (!/^[A-Z]{3}$/.test(origin || '') || !/^[A-Z]{3}$/.test(destination || '')) {
            return jsonResponse({ error: 'origin and destination must be three-letter airport codes' }, 400, responseOrigin);
        }

        const apiUrl = new URL('https://www.flyingblue.com/kamino/xp-estimation/programme');
        apiUrl.searchParams.set('origin', origin);
        apiUrl.searchParams.set('destination', destination);

        try {
            const upstream = await fetch(apiUrl, {
                headers: { Accept: 'application/json' }
            });
            if (!upstream.ok) {
                return jsonResponse({ error: `Flying Blue returned HTTP ${upstream.status}` }, 502, responseOrigin);
            }

            const data = await upstream.json();
            if (!Array.isArray(data) || !xpCategories.has(data[0])) {
                return jsonResponse({ error: 'Flying Blue returned an unexpected response' }, 502, responseOrigin);
            }

            return jsonResponse(data, 200, responseOrigin);
        } catch (error) {
            console.error('Flying Blue API request failed:', error);
            return jsonResponse({ error: 'Could not retrieve data from Flying Blue' }, 502, responseOrigin);
        }
    }
};
