// app/api/public/restaurants/slug/[slug]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json({ 
        success: false, 
        error: 'Slug is required' 
      }, { status: 400 });
    }

    await dbConnect();
    
    // Fetch restaurant with all necessary fields including loyaltySystem
    const restaurant = await Restaurant.findOne({ slug })
      .select('name description address phone cuisineType avatar banner deliveryTime deliveryFee freeDeliveryThreshold openingHours isOpen averageRating totalReviews slug loyaltySystem')
      .lean();

    if (!restaurant) {
      return NextResponse.json({ 
        success: false, 
        error: 'Restaurant not found' 
      }, { status: 404 });
    }

    // Ensure loyaltySystem has default values if not set
    const restaurantWithDefaults = {
      ...restaurant,
      loyaltySystem: restaurant.loyaltySystem || {
        isActive: false,
        ordersThreshold: 5,
        discountPercentage: 10,
        description: "Get a discount after placing a certain number of orders!"
      }
    };

    return NextResponse.json({ 
      success: true, 
      restaurant: restaurantWithDefaults
    });

  } catch (error) {
    console.error('Error fetching restaurant by slug:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch restaurant' 
    }, { status: 500 });
  }
}