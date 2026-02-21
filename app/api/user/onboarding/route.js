import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { email, fullName, age, gender, bloodGroup, height, weight } = data;

        await connectDB();

        // Check if a user with this email already exists but doesn't have a clerkId yet
        let existingUser = await User.findOne({ email });

        if (existingUser) {
            // Update the existing user with the clerkId and onboarding profile details
            existingUser.clerkId = userId;
            existingUser.fullName = fullName;
            existingUser.age = age;
            existingUser.gender = gender;
            existingUser.bloodGroup = bloodGroup;
            existingUser.height = height;
            existingUser.weight = weight;
            existingUser.profileComplete = true;
            // password field shouldn't be required anymore but it was in schema.
            // If they signed up through clerk, we don't have password. 
            // The schema has required: true for password. We should relax that or generate a random one if it's missing.
            // Wait, since we are doing email/password with clerk, clerk manages it, so our custom password field is no longer needed.
            if (!existingUser.password) {
                existingUser.password = 'handled_by_clerk';
            }

            await existingUser.save();
            return NextResponse.json({ user: existingUser, message: 'Profile updated successfully' });
        } else {
            // Create a new user
            const newUser = await User.create({
                clerkId: userId,
                email,
                fullName,
                age,
                gender,
                bloodGroup,
                height,
                weight,
                profileComplete: true,
                password: 'handled_by_clerk' // Fake password because schema requires it and we rely on Clerk for actual auth
            });

            return NextResponse.json({ user: newUser, message: 'Profile created successfully' });
        }
    } catch (error) {
        console.error('Onboarding API error:', error);
        return NextResponse.json({ error: 'Failed to process onboarding' }, { status: 500 });
    }
}
