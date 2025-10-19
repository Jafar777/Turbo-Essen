// app/api/reviews/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';

// GET: Fetch reviews for a restaurant or user's reviews
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit')) || 10;

    let reviews;

    if (restaurantId) {
      // Get reviews for a specific restaurant
      reviews = await Review.find({ restaurantId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'firstName lastName image');
    } else if (userId) {
      // Get reviews by a specific user
      reviews = await Review.find({ userId })
        .sort({ createdAt: -1 })
        .populate('restaurantId', 'name');
    } else {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      reviews 
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' }, 
      { status: 500 }
    );
  }
}

// POST: Create a new review
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'user') {
      return NextResponse.json({ error: 'Only customers can leave reviews' }, { status: 403 });
    }

    const { restaurantId, orderId, rating, comment } = await request.json();

    // Validate required fields
    if (!restaurantId || !orderId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' }, 
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify the order exists and is delivered
    const order = await Order.findOne({
      _id: orderId,
      userId: session.user.id,
      status: 'delivered'
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found, not delivered, or does not belong to you' }, 
        { status: 404 }
      );
    }

    // Check if review already exists for this order
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this order' }, 
        { status: 400 }
      );
    }

    // Create the review
    const newReview = new Review({
      userId: session.user.id,
      restaurantId,
      orderId,
      rating,
      comment: comment || '',
      userName: session.user.name,
      userImage: session.user.image || ''
    });

    await newReview.save();

    // Update restaurant rating statistics
    await updateRestaurantRating(restaurantId);

    return NextResponse.json({ 
      success: true, 
      message: 'Review submitted successfully',
      review: newReview
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' }, 
      { status: 500 }
    );
  }
}

// Helper function to update restaurant rating
async function updateRestaurantRating(restaurantId) {
  const reviews = await Review.find({ restaurantId });
  
  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  const ratingCount = {
    1: reviews.filter(r => r.rating === 1).length,
    2: reviews.filter(r => r.rating === 2).length,
    3: reviews.filter(r => r.rating === 3).length,
    4: reviews.filter(r => r.rating === 4).length,
    5: reviews.filter(r => r.rating === 5).length
  };

  await Restaurant.findByIdAndUpdate(restaurantId, {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: reviews.length,
    ratingCount
  });
}