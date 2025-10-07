// app/api/auth/update-profile/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { firstName, lastName, email, image } = await request.json();
    
    await dbConnect();
    
    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { 
        firstName, 
        lastName, 
        email: email.toLowerCase(),
        image 
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ 
      user: updatedUser,
      message: 'Profile updated successfully'
    }), {
      status: 200,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}