import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
    const session = await getIronSession(await cookies(), sessionOptions);

    if (session.user) {
        await dbConnect();
        const user = await User.findById(session.user.id);

        if (!user) {
            // User deleted or invalid
            return Response.json({ isLoggedIn: false });
        }

        return Response.json({
            isLoggedIn: true,
            id: user._id.toString(),
            name: user.name,
            email: user.email,
        });
    } else {
        return Response.json({
            isLoggedIn: false,
        });
    }
}
