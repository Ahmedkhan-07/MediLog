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

        if (!body.chiefComplaint || !body.chiefComplaint.trim()) {
            return NextResponse.json(
                { success: false, error: 'Chief complaint is required to generate a summary' },
                { status: 400 }
            );
        }

        const result = await generateVisitSummary({
            patientName: body.patientName || '',
            patientGender: body.patientGender || '',
            patientAge: body.patientAge || '',
            chiefComplaint: body.chiefComplaint,
            problemStartDate: body.problemStartDate || '',
            onsetType: body.onsetType || '',
            painLocation: body.painLocation || '',
            painCharacter: body.painCharacter || [],
            severityScore: body.severityScore || '',
            aggravatingFactors: body.aggravatingFactors || '',
            relievingFactors: body.relievingFactors || '',
            associatedSymptoms: body.associatedSymptoms || [],
            medicineTaken: body.medicineTaken || '',
            similarEpisodeBefore: body.similarEpisodeBefore || false,
            similarEpisodeDetails: body.similarEpisodeDetails || '',
            recentHistory: body.recentHistory || '',
            activeConditions: body.activeConditions || [],
            activeMedications: body.activeMedications || [],
            questionsForDoctor: body.questionsForDoctor || [],
            customNotes: body.customNotes || '',
        });

        if (result.success) {
            return NextResponse.json({ success: true, summary: result.summary });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 503 });
        }
    } catch (error) {
        console.error('Generate summary error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate summary. Please try again.' },
            { status: 500 }
        );
    }
}
