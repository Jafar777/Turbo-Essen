// app/api/job-offers/[id]/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import JobOffer from '@/models/JobOffer';
import User from '@/models/User';
import { createNotification } from '@/lib/notificationUtils';

// Add this GET method to the existing file
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const offer = await JobOffer.findById(id);
    
    if (!offer) {
      return new Response(JSON.stringify({ error: 'Job offer not found' }), { status: 404 });
    }

    // Users can only see their own job offers
    if (offer.targetUserId.toString() !== session.user.id && offer.restaurantOwnerId.toString() !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      offer: {
        _id: offer._id,
        status: offer.status,
        role: offer.role,
        restaurantId: offer.restaurantId,
        targetEmail: offer.targetEmail,
        createdAt: offer.createdAt
      }
    }), { status: 200 });

  } catch (error) {
    console.error('Error fetching job offer:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'restaurant_owner') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const offer = await JobOffer.findById(id);
    
    if (!offer) {
      return new Response(JSON.stringify({ error: 'Job offer not found' }), { status: 404 });
    }

    if (offer.restaurantOwnerId.toString() !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await JobOffer.findByIdAndDelete(id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('Error deleting job offer:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json(); // 'accept' or 'reject'

    await dbConnect();

    const offer = await JobOffer.findById(id)
      .populate('restaurantId', 'name ownerId')
      .populate('targetUserId');
    
    if (!offer) {
      return new Response(JSON.stringify({ error: 'Job offer not found' }), { status: 404 });
    }

    if (offer.targetUserId._id.toString() !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (offer.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'This job offer is no longer available' }), { status: 400 });
    }

   // In the PUT method, update the accept section:
if (action === 'accept') {
  console.log('Accepting job offer, updating user role to:', offer.role);
  
  // Update user role AND set restaurantId
  const updatedUser = await User.findByIdAndUpdate(
    session.user.id, 
    { 
      role: offer.role,
      restaurantId: offer.restaurantId // Add this line
    },
    { new: true }
  );
  
  console.log('User role and restaurant updated:', updatedUser.role, updatedUser.restaurantId);

  // Update offer status
  offer.status = 'accepted';
  await offer.save();

  // Create notification for restaurant owner
  try {
    await createNotification({
      userId: offer.restaurantId.ownerId,
      type: 'job_accepted',
      title: 'Job Offer Accepted',
      message: `${session.user.firstName} ${session.user.lastName} has accepted your job offer for ${offer.role} role`,
      relatedId: offer._id,
      relatedModel: 'JobOffer'
    });
    console.log('Notification created for restaurant owner');
  } catch (notificationError) {
    console.error('Error creating notification for restaurant owner:', notificationError);
  }

  result = { 
    success: true, 
    message: `Job offer accepted successfully! You are now a ${offer.role}.`,
    newRole: offer.role
  };
}else if (action === 'reject') {
      offer.status = 'rejected';
      await offer.save();

      // Create notification for restaurant owner
      await createNotification({
        userId: offer.restaurantId.ownerId,
        type: 'job_rejected',
        title: 'Job Offer Declined',
        message: `${session.user.firstName} ${session.user.lastName} has declined your job offer for ${offer.role} role`,
        relatedId: offer._id,
        relatedModel: 'JobOffer'
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Job offer ${action}ed successfully` 
    }), { status: 200 });

  } catch (error) {
    console.error('Error updating job offer:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}