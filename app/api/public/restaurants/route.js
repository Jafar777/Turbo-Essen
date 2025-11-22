// app/api/public/restaurants/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch restaurants from your database - include openingHours and isOpen
    const restaurants = await Restaurant.find({ isActive: true })
      .select('name description address phone cuisineType avatar banner openingHours isOpen averageRating totalReviews slug totalTables availableTables createdAt')
      .sort({ createdAt: -1 });

    // Extract unique cuisine types
    const cuisineTypes = [...new Set(restaurants.map(r => r.cuisineType).filter(Boolean))];

    return NextResponse.json({ 
      success: true, 
      restaurants: restaurants.map(r => ({
        _id: r._id.toString(),
        name: r.name,
        description: r.description,
        address: r.address,
        phone: r.phone,
        cuisineType: r.cuisineType,
        avatar: r.avatar,
        banner: r.banner,
        openingHours: r.openingHours, // ← THIS IS MISSING IN YOUR CURRENT API
        isOpen: r.isOpen, // ← THIS IS MISSING IN YOUR CURRENT API
        averageRating: r.averageRating,
        totalReviews: r.totalReviews,
        slug: r.slug,
        totalTables: r.totalTables,
        availableTables: r.availableTables,
        createdAt: r.createdAt
      })),
      cuisineTypes
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}