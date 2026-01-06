import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email });

        if (!user) {
            return Response.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return Response.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const session = await getIronSession(await cookies(), sessionOptions);
        session.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            isLoggedIn: true,
        };
        await session.save();

        return Response.json({
            message: 'Logged in successfully',
            user: session.user,
        });

    } catch (error) {
        console.error('Login error:', error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
