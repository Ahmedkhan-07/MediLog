import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Visit from '@/models/Visit';
import User from '@/models/User';

export async function GET(request, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const dbUser = await User.findOne({ clerkId: userId });
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const visit = await Visit.findOne({
            _id: params.id,
            userId: dbUser._id,
        });

        if (!visit) {
            return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
        }

        return NextResponse.json({ visit });
    } catch (error) {
        console.error('Get visit error:', error);
        return NextResponse.json({ error: 'Failed to fetch visit' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const dbUser = await User.findOne({ clerkId: userId });
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const visit = await Visit.findOneAndDelete({
            _id: params.id,
            userId: dbUser._id,
        });

        if (!visit) {
            return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Visit deleted successfully' });
    } catch (error) {
        console.error('Delete visit error:', error);
        return NextResponse.json({ error: 'Failed to delete visit' }, { status: 500 });
    }
}
