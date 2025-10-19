// app/api/public/restaurants/[id]/reviews/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;

    const reviews = await Review.find({ restaurantId: id })
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