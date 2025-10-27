// app/api/public/restaurants/slug/[slug]/reviews/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Restaurant from '@/models/Restaurant';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    
    await dbConnect();

    // First, find the restaurant by slug to get its ID
    const restaurant = await Restaurant.findOne({ slug, isActive: true });
    
    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;

    const reviews = await Review.find({ restaurantId: restaurant._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'firstName lastName image');

    return NextResponse.json({ 
      success: true, 
      reviews: reviews.map(review => ({
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        userName: review.userName,
        userImage: review.userImage,
        createdAt: review.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching restaurant reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' }, 
      { status: 500 }
    );
  }
}