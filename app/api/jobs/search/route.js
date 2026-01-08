import { NextResponse } from 'next/server';

const CACHE_TTL = 3600 * 1000; // 1 hour
const cache = new Map();

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'developer';
    const page = searchParams.get('page') || '1';
    const datePosted = searchParams.get('date_posted') || 'all';
    const jobType = searchParams.get('job_type') || '';
    const remote = searchParams.get('remote') === 'true';
    const country = searchParams.get('country') || 'us';

    // Create a cache key including filters
    const cacheKey = `${query}_${page}_${datePosted}_${jobType}_${remote}_${country}`;
    const now = Date.now();

    // Check Cache
    if (cache.has(cacheKey)) {
        const { timestamp, data } = cache.get(cacheKey);
        if (now - timestamp < CACHE_TTL) {
            console.log(`🚀 Serving from cache: ${cacheKey}`);
            return NextResponse.json({ success: true, data });
        }
    }

    let url = `https://${process.env.RAPID_API_HOST}/search?query=${encodeURIComponent(query)}&page=${page}&num_pages=1&country=${country}&date_posted=${datePosted}`;
    if (jobType) url += `&employment_types=${jobType}`;
    if (remote) url += `&remote_jobs_only=true`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': process.env.RAPID_API_KEY,
            'x-rapidapi-host': process.env.RAPID_API_HOST
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            return NextResponse.json({ error: response.statusText }, { status: response.status });
        }
        const data = await response.json();

        // Update Cache
        if (data.data) {
            cache.set(cacheKey, { timestamp: now, data: data.data });
        }

        return NextResponse.json({ success: true, data: data.data || [] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
