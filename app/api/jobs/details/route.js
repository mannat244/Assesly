import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const url = `https://${process.env.RAPID_API_HOST}/job-details?job_id=${encodeURIComponent(id)}&country=us`;
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
        const result = await response.json();
        const jobData = result.data && result.data.length > 0 ? result.data[0] : null;

        if (!jobData) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: jobData });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
