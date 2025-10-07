// app/api/applications/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Application from '@/models/Application';
import User from '@/models/User';

import { notifyApplicationStatus } from '@/lib/notificationUtils';


export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admin can access applications
    if (!session || session.user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    await dbConnect();
    
    // Get pending applications and populate user info
    const applications = await Application.find({ status: 'pending' })
      .populate('userId', 'firstName lastName email')
      .sort({ appliedAt: -1 });

    return new Response(JSON.stringify({ applications }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
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

    const { applicationId, action } = await request.json();
    
    await dbConnect();
    
    const application = await Application.findById(applicationId).populate('userId');
    
    if (!application) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
      });
    }

    if (action === 'accept') {
      await User.findByIdAndUpdate(application.userId._id, { role: 'restaurant_owner' });
      application.status = 'approved';
      application.reviewedAt = new Date();
      await application.save();
      
      // Notify the user
      await notifyApplicationStatus(application.userId._id, application, 'accepted');
      
    } else if (action === 'reject') {
      application.status = 'rejected';
      application.reviewedAt = new Date();
      await application.save();
      
      // Notify the user
      await notifyApplicationStatus(application.userId._id, application, 'rejected');
    }

    return new Response(JSON.stringify({ 
      message: `Application ${action}ed successfully` 
    }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error processing application:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
