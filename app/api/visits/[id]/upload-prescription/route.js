import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Visit from '@/models/Visit';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request, { params }) {
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

        const formData = await request.formData();
        const file = formData.get('image');

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No image file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { success: false, error: 'Only image files are allowed' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024;
        const buffer = Buffer.from(await file.arrayBuffer());
        if (buffer.length > MAX_SIZE) {
            return NextResponse.json(
                { success: false, error: 'Image must be under 5MB' },
                { status: 400 }
            );
        }

        // Upload to Cloudinary
        const result = await uploadImage(buffer, 'medilog/prescriptions');

        // Save URL to visit
        visit.prescriptionImage = result.secure_url;
        await visit.save();

        return NextResponse.json({
            success: true,
            data: { imageUrl: result.secure_url },
        });
    } catch (error) {
        console.error('Upload prescription image error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload image' },
            { status: 500 }
        );
    }
}
