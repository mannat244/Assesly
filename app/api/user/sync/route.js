import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const session = await getIronSession(await cookies(), sessionOptions);

        if (!session.user) {
            return Response.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findById(session.user.id);

        if (!user) {
            return Response.json({ message: 'User not found' }, { status: 404 });
        }

        return Response.json({
            name: user.name,
            resume: user.resume,
            jobDescription: user.jobDescription,
            targetCompany: user.targetCompany,
            role: user.role,
            interviewHistory: user.interviewHistory || [],
            preferences: user.preferences || { usePremiumAudio: false },
        });
    } catch (error) {
        console.error("Sync API Error:", error);
        return Response.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const session = await getIronSession(await cookies(), sessionOptions);

    if (!session.user) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    await dbConnect();

    const updateData = {};

    // Atomic Push for History (Prevents Overwrites)
    if (data.pushHistoryItem) {
        // Use $push with $each and $position:0 to prepend to the array safely
        await User.findByIdAndUpdate(session.user.id, {
            $push: {
                interviewHistory: {
                    $each: [data.pushHistoryItem],
                    $position: 0
                }
            }
        });

        // If other fields are present, update them separately (rare in this specific flow but good for safety)
        if (Object.keys(data).length > 1) {
            const setFields = { ...data };
            delete setFields.pushHistoryItem;
            if (Object.keys(setFields).length > 0) {
                await User.findByIdAndUpdate(session.user.id, setFields);
            }
        }

        return Response.json({ success: true });
    }

    // Standard Set Updates
    if (data.resume !== undefined) updateData.resume = data.resume;
    if (data.jobDescription !== undefined) updateData.jobDescription = data.jobDescription;
    if (data.targetCompany !== undefined) updateData.targetCompany = data.targetCompany;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.interviewHistory !== undefined) updateData.interviewHistory = data.interviewHistory; // Full replace (legacy/fallback)
    if (data.preferences !== undefined) updateData.preferences = data.preferences;

    await User.findByIdAndUpdate(session.user.id, updateData);

    return Response.json({ success: true });
}
