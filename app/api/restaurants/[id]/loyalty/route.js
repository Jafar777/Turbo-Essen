// app/api/restaurants/[id]/loyalty/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const loyaltyData = await request.json();

    await dbConnect();

    // Verify the user owns this restaurant (unless admin)
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    if (session.user.role !== 'admin' && restaurant.ownerId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update loyalty system
    restaurant.loyaltySystem = {
      ...restaurant.loyaltySystem,
      ...loyaltyData
    };

    await restaurant.save();

    return NextResponse.json({ 
      success: true, 
      loyaltySystem: restaurant.loyaltySystem,
      message: 'Loyalty system updated successfully'
    });

  } catch (error) {
    console.error('Error updating loyalty system:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    await dbConnect();
    
    const restaurant = await Restaurant.findById(id).select('loyaltySystem');
    
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      loyaltySystem: restaurant.loyaltySystem
    });

  } catch (error) {
    console.error('Error fetching loyalty system:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch loyalty system' }, { status: 500 });
  }
}