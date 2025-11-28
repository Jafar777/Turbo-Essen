// app/api/restaurants/[id]/route.js
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
    const updateData = await request.json();

    await dbConnect();

    // Verify the user owns this restaurant (unless admin)
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    if (session.user.role !== 'admin' && restaurant.ownerId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle openingHours structure to ensure proper format
    if (updateData.openingHours) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      days.forEach(day => {
        if (updateData.openingHours[day]) {
          // Ensure each day has the proper structure
          updateData.openingHours[day] = {
            open: updateData.openingHours[day].open || '09:00',
            close: updateData.openingHours[day].close || '22:00',
            closed: updateData.openingHours[day].closed || false
          };
        }
      });
    }

    // Update the restaurant
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ 
      success: true, 
      restaurant: updatedRestaurant 
    });

  } catch (error) {
    console.error('Error updating restaurant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Check if the ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid restaurant ID format' 
      }, { status: 400 });
    }
    
    await dbConnect();
    
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      restaurant: restaurant.toObject()
    });

  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch restaurant' }, { status: 500 });
  }
}