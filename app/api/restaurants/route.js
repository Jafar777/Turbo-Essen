// app/api/restaurants/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch restaurants including loyaltySystem
    const restaurants = await Restaurant.find({})
      .select('name description address phone cuisineType avatar banner deliveryTime deliveryFee freeDeliveryThreshold openingHours isOpen averageRating totalReviews slug loyaltySystem')
      .sort({ name: 1 });

    // Ensure all restaurants have default loyaltySystem values
    const restaurantsWithDefaults = restaurants.map(r => ({
      _id: r._id.toString(),
      name: r.name,
      description: r.description,
      address: r.address,
      phone: r.phone,
      cuisineType: r.cuisineType,
      avatar: r.avatar,
      banner: r.banner,
      deliveryTime: r.deliveryTime,
      deliveryFee: r.deliveryFee,
      freeDeliveryThreshold: r.freeDeliveryThreshold,
      openingHours: r.openingHours,
      isOpen: r.isOpen,
      averageRating: r.averageRating,
      totalReviews: r.totalReviews,
      slug: r.slug,
      loyaltySystem: r.loyaltySystem || {
        isActive: false,
        ordersThreshold: 5,
        discountPercentage: 10,
        description: "Get a discount after placing a certain number of orders!"
      }
    }));

    return NextResponse.json({ 
      success: true, 
      restaurants: restaurantsWithDefaults
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}