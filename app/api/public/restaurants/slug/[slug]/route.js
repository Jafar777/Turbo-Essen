// app/api/public/restaurants/slug/[slug]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    
    await dbConnect();
    
    const restaurant = await Restaurant.findOne({ slug, isActive: true });
    
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      restaurant 
    });
  } catch (error) {
    console.error('Error fetching restaurant by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    );
  }
}