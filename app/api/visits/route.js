import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Visit from '@/models/Visit';
import User from '@/models/User';
import { uploadImage } from '@/lib/cloudinary';
import { generateMedicalSummary } from '@/lib/gemini';

export async function GET(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const dbUser = await User.findOne({ clerkId: userId });
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const doctor = searchParams.get('doctor');
        const specialty = searchParams.get('specialty');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const search = searchParams.get('search');

        const filter = { userId: dbUser._id };

        if (doctor) {
            filter.doctorName = { $regex: doctor, $options: 'i' };
        }
        if (specialty) {
            filter.specialty = { $regex: specialty, $options: 'i' };
        }
        if (dateFrom || dateTo) {
            filter.visitDate = {};
            if (dateFrom) filter.visitDate.$gte = new Date(dateFrom);
            if (dateTo) filter.visitDate.$lte = new Date(dateTo);
        }
        if (search) {
            filter.$or = [
                { doctorName: { $regex: search, $options: 'i' } },
                { specialty: { $regex: search, $options: 'i' } },
                { hospitalName: { $regex: search, $options: 'i' } },
                { originalSymptoms: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Visit.countDocuments(filter);
        const visits = await Visit.find(filter)
            .sort({ visitDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return NextResponse.json({ visits, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Get visits error:', error);
        return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const dbUser = await User.findOne({ clerkId: userId });
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        const contentType = request.headers.get('content-type') || '';
        let visitData;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            visitData = {
                doctorName: formData.get('doctorName'),
                hospitalName: formData.get('hospitalName') || '',
                specialty: formData.get('specialty'),
                visitDate: formData.get('visitDate'),
                originalSymptoms: formData.get('originalSymptoms'),
                aiSummary: formData.get('aiSummary') || '',
                medicines: JSON.parse(formData.get('medicines') || '[]'),
                doctorNotes: formData.get('doctorNotes') || '',
            };

            // Handle prescription image upload
            const prescriptionFile = formData.get('prescription');
            if (prescriptionFile && prescriptionFile.size > 0) {
                const bytes = await prescriptionFile.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const result = await uploadImage(buffer);
                visitData.prescriptionUrl = result.secure_url;
            }
        } else {
            visitData = await request.json();
        }

        // Generate AI summary if not already provided
        if (!visitData.aiSummary && visitData.originalSymptoms) {
            const summary = await generateMedicalSummary(visitData.originalSymptoms);
            if (summary) {
                visitData.aiSummary = summary;
            }
        }

        const visit = await Visit.create({
            userId: dbUser._id,
            ...visitData,
        });

        return NextResponse.json({ visit, message: 'Visit logged successfully' }, { status: 201 });
    } catch (error) {
        console.error('Create visit error:', error);
        return NextResponse.json({ error: 'Failed to create visit' }, { status: 500 });
    }
}
