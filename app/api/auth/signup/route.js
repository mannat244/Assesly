import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        const userExists = await User.findOne({ email });

        if (userExists) {
            return Response.json({ message: 'User already exists' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        const session = await getIronSession(await cookies(), sessionOptions);
        session.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            isLoggedIn: true,
        };
        await session.save();

        return Response.json({
            message: 'User created successfully',
            user: session.user,
        });
    } catch (error) {
        console.error('Signup error:', error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
