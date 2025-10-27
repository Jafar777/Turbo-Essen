// app/api/reviews/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Restaurant from '@/models/Restaurant';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const restaurantId = review.restaurantId;

    // Delete the review
    await Review.findByIdAndDelete(id);

    // Update restaurant rating statistics
    await updateRestaurantRating(restaurantId);

    return NextResponse.json({ 
      success: true, 
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' }, 
      { status: 500 }
    );
  }
}

// Helper function to update restaurant rating
async function updateRestaurantRating(restaurantId) {
  const reviews = await Review.find({ restaurantId });
  
  if (reviews.length === 0) {
    // No reviews left, reset ratings
    await Restaurant.findByIdAndUpdate(restaurantId, {
      averageRating: 0,
      totalReviews: 0,
      ratingCount: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
    return;
  }

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
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length,
    ratingCount
  });
}