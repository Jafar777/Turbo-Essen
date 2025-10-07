// app/api/users/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions"; // Remove the curly braces
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';

// app/api/users/route.js - Updated GET function
export async function GET() {
  try {
    // Add logging to see if the session is being retrieved at all
    console.log("Attempting to get server session...");
    const session = await getServerSession(authOptions);
    console.log("Session retrieved:", session);
    
    if (!session) {
      console.log("No session found");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    
    // Add detailed user info logging
    console.log("User role from session:", session.user?.role);
    console.log("Full user object:", session.user);
    
    if (session.user.role !== 'admin') {
      console.log("User role is not admin");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    await dbConnect();
    const users = await User.find({}).select('-password');
    
    return new Response(JSON.stringify({ users }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { userId, role } = await request.json();
    
    await dbConnect();
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ user }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}