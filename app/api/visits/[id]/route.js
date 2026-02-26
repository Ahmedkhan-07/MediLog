import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Visit from '@/models/Visit';

const CLINICAL_FIELDS = [
    'chiefComplaint', 'problemStartDate', 'onsetType', 'painLocation',
    'painCharacter', 'severityScore', 'aggravatingFactors', 'relievingFactors',
    'associatedSymptoms', 'medicineTaken', 'similarEpisodeBefore',
    'similarEpisodeDetails', 'recentHistory', 'questionsForDoctor',
    'customNotes', 'aiGeneratedSummary', 'doctorName', 'visitDate', 'status',
];

export async function GET(request, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { id } = await params;
        const visit = await Visit.findOne({ _id: id, userId });

        if (!visit) {
            return NextResponse.json({ success: false, error: 'Visit not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: { visit } });
    } catch (error) {
        console.error('Get visit error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch visit' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { id } = await params;
        const visit = await Visit.findOne({ _id: id, userId });

        if (!visit) {
            return NextResponse.json({ success: false, error: 'Visit not found' }, { status: 404 });
        }

        const body = await request.json();

        if (visit.status === 'Completed') {
            // Only allow updating prescribedMedicines when Completed
            const hasClinicalFields = Object.keys(body).some(
                (key) => CLINICAL_FIELDS.includes(key)
            );
            if (hasClinicalFields) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Clinical summary is locked after completion. Only prescription can be updated.',
                    },
                    { status: 400 }
                );
            }
            if (body.prescribedMedicines) {
                visit.prescribedMedicines = body.prescribedMedicines;
            }
        } else {
            // Draft or Awaiting Doctor — allow all clinical field updates
            CLINICAL_FIELDS.forEach((field) => {
                if (body[field] !== undefined) {
                    visit[field] = body[field];
                }
            });
            if (body.prescribedMedicines !== undefined) {
                visit.prescribedMedicines = body.prescribedMedicines;
            }
        }

        await visit.save();

        return NextResponse.json({ success: true, data: { visit } });
    } catch (error) {
        console.error('Update visit error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update visit' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { id } = await params;
        const visit = await Visit.findOneAndDelete({ _id: id, userId });

        if (!visit) {
            return NextResponse.json({ success: false, error: 'Visit not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: { message: 'Visit deleted successfully' } });
    } catch (error) {
        console.error('Delete visit error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete visit' }, { status: 500 });
    }
}
