import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateVisitSummary } from '@/lib/gemini';

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const symptoms = body.symptoms || body.chiefComplaint || '';

        if (!symptoms || symptoms.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Symptoms text is required' },
                { status: 400 }
            );
        }

        const result = await generateVisitSummary({ chiefComplaint: symptoms });

        if (result.success) {
            return NextResponse.json({ success: true, summary: result.summary });
        } else {
            return NextResponse.json(
                { success: false, error: result.error || 'Failed to generate summary' },
                { status: 503 }
            );
        }
    } catch (error) {
        console.error('Gemini API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate summary' },
            { status: 500 }
        );
    }
}
