import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Visit from '@/models/Visit';

export async function GET(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        const filter = { userId };

        if (search) {
            filter.$or = [
                { chiefComplaint: { $regex: search, $options: 'i' } },
                { doctorName: { $regex: search, $options: 'i' } },
                { painLocation: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Visit.countDocuments(filter);
        const visits = await Visit.find(filter).sort({ visitDate: -1 });

        return NextResponse.json({
            success: true,
            data: { visits, total },
        });
    } catch (error) {
        console.error('Get visits error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch visits' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();

        if (!body.chiefComplaint || !body.chiefComplaint.trim()) {
            return NextResponse.json(
                { success: false, error: 'Chief complaint is required' },
                { status: 400 }
            );
        }

        const visit = await Visit.create({
            userId,
            visitDate: body.visitDate || new Date(),
            doctorName: body.doctorName || '',
            status: body.status || 'Draft',
            chiefComplaint: body.chiefComplaint,
            problemStartDate: body.problemStartDate || undefined,
            onsetType: body.onsetType || '',
            painLocation: body.painLocation || '',
            painCharacter: body.painCharacter || [],
            severityScore: body.severityScore || undefined,
            aggravatingFactors: body.aggravatingFactors || '',
            relievingFactors: body.relievingFactors || '',
            associatedSymptoms: body.associatedSymptoms || [],
            medicineTaken: body.medicineTaken || '',
            similarEpisodeBefore: body.similarEpisodeBefore || false,
            similarEpisodeDetails: body.similarEpisodeDetails || '',
            recentHistory: body.recentHistory || '',
            questionsForDoctor: body.questionsForDoctor || [],
            customNotes: body.customNotes || '',
            aiGeneratedSummary: body.aiGeneratedSummary || '',
        });

        return NextResponse.json({ success: true, data: { visit } }, { status: 201 });
    } catch (error) {
        console.error('Create visit error:', error);
        return NextResponse.json({ success: false, error: 'Failed to create visit' }, { status: 500 });
    }
}
