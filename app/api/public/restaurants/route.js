// app/api/public/restaurants/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const cuisineType = searchParams.get('cuisineType');
    const searchQuery = searchParams.get('search');
    const minRating = searchParams.get('minRating');

    let filter = { isActive: true };

    // Filter by cuisine type
    if (cuisineType && cuisineType !== 'all') {
      filter.cuisineType = cuisineType;
    }

    // Filter by search query - NOW INCLUDES ADDRESS
    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { cuisineType: { $regex: searchQuery, $options: 'i' } },
        { address: { $regex: searchQuery, $options: 'i' } } // ADDED THIS LINE
      ];
    }

    // Filter by minimum rating
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    const restaurants = await Restaurant.find(filter)
      .select('name description address phone cuisineType avatar banner averageRating totalReviews totalTables availableTables slug') // ADD slug here
      .sort({ averageRating: -1, totalReviews: -1 });

    // Get unique cuisine types for filters
    const cuisineTypes = await Restaurant.distinct('cuisineType', { isActive: true });

    return NextResponse.json({
      success: true,
      restaurants,
      cuisineTypes: cuisineTypes.filter(Boolean).sort() // Remove null/empty and sort
    });

  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}