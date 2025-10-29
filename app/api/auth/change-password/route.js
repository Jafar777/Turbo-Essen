// app/api/auth/change-password/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { comparePassword, hashPassword } from '@/lib/passwordUtils';

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { oldPassword, newPassword, confirmPassword } = await request.json();
    
    // Validate input
    if (!oldPassword || !newPassword || !confirmPassword) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
      });
    }

    if (newPassword !== confirmPassword) {
      return new Response(JSON.stringify({ error: 'New passwords do not match' }), {
        status: 400,
      });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
      });
    }

    await dbConnect();
    
    // Get user with password field
    const user = await User.findById(session.user.id).select('+password');
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }

    // Verify old password
    const isOldPasswordValid = await comparePassword(oldPassword, user.password);
    
    if (!isOldPasswordValid) {
      return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
        status: 400,
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    return new Response(JSON.stringify({ 
      message: 'Password updated successfully'
    }), {
      status: 200,
    });
  } catch (error) {
    console.error('Password change error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}