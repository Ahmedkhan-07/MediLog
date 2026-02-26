import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import AiConsultation from '@/models/AiConsultation';
import { generateSessionSummary } from '@/lib/gemini';

export async function POST(request, { params }) {
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

        if (session.endedAt) {
            return NextResponse.json({
                success: true,
                data: { summary: session.sessionSummary || 'Session already ended.' },
            });
        }

        const summary = await generateSessionSummary(session.messages);

        session.sessionSummary = summary;
        session.endedAt = new Date();
        await session.save();

        return NextResponse.json({
            success: true,
            data: { summary },
        });
    } catch (error) {
        console.error('End session error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to end session' },
            { status: 500 }
        );
    }
}
