// app/api/restaurants/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch restaurants from your database
    const restaurants = await Restaurant.find({})
      .select('name description address phone cuisineType avatar banner deliveryTime deliveryFee freeDeliveryThreshold openingHours isOpen averageRating totalReviews slug')
      .sort({ name: 1 });

    // Debug: log what we're getting from the database
    console.log('Restaurants from DB:', restaurants.map(r => ({
      name: r.name,
      deliveryFee: r.deliveryFee,
      deliveryTime: r.deliveryTime,
      hasDeliveryFee: r.deliveryFee !== undefined,
      hasDeliveryTime: r.deliveryTime !== undefined
    })));

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
        deliveryTime: r.deliveryTime,
        deliveryFee: r.deliveryFee,
        freeDeliveryThreshold: r.freeDeliveryThreshold,
        openingHours: r.openingHours,
        isOpen: r.isOpen,
        averageRating: r.averageRating,
        totalReviews: r.totalReviews,
        slug: r.slug
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