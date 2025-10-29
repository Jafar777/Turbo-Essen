// app/api/restaurants/owner/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'restaurant_owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find the restaurant by ownerId
    const restaurant = await Restaurant.findOne({ ownerId: session.user.id })
      .select('name description address phone cuisineType avatar banner slug');

    if (!restaurant) {
      return NextResponse.json({ 
        success: false, 
        error: 'Restaurant not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      restaurant: {
        _id: restaurant._id.toString(),
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        phone: restaurant.phone,
        cuisineType: restaurant.cuisineType,
        avatar: restaurant.avatar,
        banner: restaurant.banner,
        slug: restaurant.slug
      }
    });

  } catch (error) {
    console.error('Error fetching restaurant by owner:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch restaurant' 
    }, { status: 500 });
  }
}