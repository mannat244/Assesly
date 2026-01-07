import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export async function GET() {
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
        preferences: { usePremiumAudio: false },
    });
}

export async function POST(request) {
    const session = await getIronSession(await cookies(), sessionOptions);

    if (!session.user) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    await dbConnect();

    const updateData = {};
    if (data.resume !== undefined) updateData.resume = data.resume;
    if (data.jobDescription !== undefined) updateData.jobDescription = data.jobDescription;
    if (data.targetCompany !== undefined) updateData.targetCompany = data.targetCompany;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.interviewHistory !== undefined) updateData.interviewHistory = data.interviewHistory;
    if (data.preferences !== undefined) updateData.preferences = data.preferences;

    await User.findByIdAndUpdate(session.user.id, updateData);

    return Response.json({ success: true });
}
