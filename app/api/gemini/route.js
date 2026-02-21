import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateMedicalSummary } from '@/lib/gemini';

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { symptoms } = await request.json();

        if (!symptoms || symptoms.trim().length === 0) {
            return NextResponse.json({ error: 'Symptoms text is required' }, { status: 400 });
        }

        const summary = await generateMedicalSummary(symptoms);

        if (!summary) {
            return NextResponse.json(
                { error: 'AI summary generation failed. Please check your Gemini API key.' },
                { status: 503 }
            );
        }

        return NextResponse.json({ summary });
    } catch (error) {
        console.error('Gemini API error:', error);
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
}
