import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import AiConsultation from '@/models/AiConsultation';
import User from '@/models/User';

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Look up the user's MongoDB _id for profileId reference
        const dbUser = await User.findOne({ clerkId: userId });

        const session = await AiConsultation.create({
            userId,
            profileId: dbUser ? dbUser._id : undefined,
            disclaimerAccepted: true,
            disclaimerAcceptedAt: new Date(),
            startedAt: new Date(),
            messages: [],
        });

        return NextResponse.json({
            success: true,
            data: { sessionId: session._id },
        }, { status: 201 });
    } catch (error) {
        console.error('Start session error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to start session' },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const sessions = await AiConsultation.find({ userId })
            .sort({ startedAt: -1 })
            .select('_id startedAt endedAt messages sessionSummary redFlagTriggered')
            .lean();

        const sessionList = sessions.map((s) => ({
            sessionId: s._id,
            startedAt: s.startedAt,
            endedAt: s.endedAt,
            messageCount: s.messages ? s.messages.length : 0,
            sessionSummary: s.sessionSummary || '',
            redFlagTriggered: s.redFlagTriggered || false,
        }));

        return NextResponse.json({ success: true, data: { sessions: sessionList } });
    } catch (error) {
        console.error('Get sessions error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch sessions' },
            { status: 500 }
        );
    }
}
