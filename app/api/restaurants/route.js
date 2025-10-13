// app/api/restaurants/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; // Adjust path to your db connection
import Restaurant from '@/models/Restaurant'; // Adjust path to your Restaurant model

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch restaurants from your database
    const restaurants = await Restaurant.find({})
      .select('name description address phone cuisineType avatar banner')
      .sort({ name: 1 });

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
        banner: r.banner
      }))
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}