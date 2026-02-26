import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Visit from '@/models/Visit';

export async function PUT(request, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { id } = await params;
        const body = await request.json();

        if (!body.prescribedMedicines || !Array.isArray(body.prescribedMedicines)) {
            return NextResponse.json(
                { success: false, error: 'prescribedMedicines array is required' },
                { status: 400 }
            );
        }

        for (const med of body.prescribedMedicines) {
            if (!med.medicineName || !med.medicineName.trim()) {
                return NextResponse.json(
                    { success: false, error: 'Each medicine must have a name' },
                    { status: 400 }
                );
            }
        }

        const visit = await Visit.findOneAndUpdate(
            { _id: id, userId },
            {
                $set: {
                    prescribedMedicines: body.prescribedMedicines.map((med) => ({
                        ...med,
                        addedAt: med.addedAt || new Date(),
                    })),
                    status: 'Completed',
                },
            },
            { new: true }
        );

        if (!visit) {
            return NextResponse.json({ success: false, error: 'Visit not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: { visit } });
    } catch (error) {
        console.error('Save prescription error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save prescription' },
            { status: 500 }
        );
    }
}
