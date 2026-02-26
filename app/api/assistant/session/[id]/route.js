import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import AiConsultation from '@/models/AiConsultation';

export async function GET(request, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { id } = await params;
        const session = await AiConsultation.findOne({ _id: id, userId });

        if (!session) {
            return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                session: {
                    _id: session._id,
                    startedAt: session.startedAt,
                    endedAt: session.endedAt,
                    messages: session.messages,
                    sessionSummary: session.sessionSummary,
                    redFlagTriggered: session.redFlagTriggered,
                },
            },
        });
    } catch (error) {
        console.error('Get session error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch session' },
            { status: 500 }
        );
    }
}
