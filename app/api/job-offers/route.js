// app/api/job-offers/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import JobOffer from '@/models/JobOffer';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import { createNotification } from '@/lib/notificationUtils';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'restaurant_owner') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { targetEmail, role, message, restaurantId } = await request.json();

    await dbConnect();

    // Verify restaurant ownership
    const restaurant = await Restaurant.findOne({ 
      _id: restaurantId, 
      ownerId: session.user.id 
    });
    
    if (!restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found or access denied' }), { status: 404 });
    }

    // Check if user exists with this email
    const targetUser = await User.findOne({ email: targetEmail.toLowerCase() });
    
    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'No user found with this email address' }), { status: 404 });
    }

    // Check if user already has a role other than 'user'
    if (targetUser.role !== 'user') {
      return new Response(JSON.stringify({ error: 'This user already has a role and cannot receive job offers' }), { status: 400 });
    }

    // Check for existing pending offer
    const existingOffer = await JobOffer.findOne({
      targetEmail: targetEmail.toLowerCase(),
      status: 'pending',
      restaurantId: restaurantId
    });

    if (existingOffer) {
      return new Response(JSON.stringify({ error: 'A pending job offer already exists for this user' }), { status: 400 });
    }

    // Create job offer
    const jobOffer = new JobOffer({
      restaurantId,
      restaurantOwnerId: session.user.id,
      targetUserId: targetUser._id,
      targetEmail: targetEmail.toLowerCase(),
      role,
      message
    });

    await jobOffer.save();

    // Create notification for the target user
    try {
      await createNotification({
        userId: targetUser._id,
        type: 'job_offer',
        title: 'New Job Offer',
        message: `You have received a job offer from ${restaurant.name} as a ${role}`,
        relatedId: jobOffer._id,
        relatedModel: 'JobOffer'
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the entire request if notification fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Job offer sent successfully',
      offer: jobOffer 
    }), { status: 201 });

  } catch (error) {
    console.error('Error creating job offer:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await dbConnect();

    // For restaurant owners: get offers they sent
    if (session.user.role === 'restaurant_owner') {
      const offers = await JobOffer.find({ restaurantOwnerId: session.user.id })
        .populate('restaurantId', 'name')
        .sort({ createdAt: -1 });
      
      return new Response(JSON.stringify({ offers }), { status: 200 });
    }

    // For other roles: get offers received
    const offers = await JobOffer.find({ targetUserId: session.user.id, status: 'pending' })
      .populate('restaurantId', 'name')
      .populate('restaurantOwnerId', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    return new Response(JSON.stringify({ offers }), { status: 200 });

  } catch (error) {
    console.error('Error fetching job offers:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}