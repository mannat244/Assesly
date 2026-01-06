import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export async function GET() {
    const session = await getIronSession(await cookies(), sessionOptions);

    if (session.user) {
        return Response.json({
            isLoggedIn: true,
            ...session.user,
        });
    } else {
        return Response.json({
            isLoggedIn: false,
        });
    }
}
