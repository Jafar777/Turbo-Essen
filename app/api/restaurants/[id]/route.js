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

    // Handle table creation when totalTables changes
    if (updateData.totalTables !== undefined) {
      const newTotalTables = parseInt(updateData.totalTables);
      
      // Initialize tables array if it doesn't exist
      if (!restaurant.tables || !Array.isArray(restaurant.tables)) {
        restaurant.tables = [];
      }
      
      const currentTotalTables = restaurant.tables.length;
      
      if (newTotalTables > currentTotalTables) {
        // Add new tables
        const startNumber = currentTotalTables + 1;
        for (let i = startNumber; i <= newTotalTables; i++) {
          restaurant.tables.push({
            number: i,
            chairs: 4,
            status: 'available',
            section: 'main'
          });
        }
      } else if (newTotalTables < currentTotalTables) {
        // Remove extra tables (keep first N tables)
        restaurant.tables = restaurant.tables.slice(0, newTotalTables);
      }
      
      // Update the totalTables field
      restaurant.totalTables = newTotalTables;
      
      // Remove totalTables from updateData to avoid conflict
      delete updateData.totalTables;
    }

    // Handle openingHours structure
    if (updateData.openingHours) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      days.forEach(day => {
        if (updateData.openingHours[day]) {
          updateData.openingHours[day] = {
            open: updateData.openingHours[day].open || '09:00',
            close: updateData.openingHours[day].close || '22:00',
            closed: updateData.openingHours[day].closed || false
          };
        }
      });
    }

    // Update all other fields except tables (handled above)
    const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'tables');
    fieldsToUpdate.forEach(key => {
      restaurant[key] = updateData[key];
    });

    // Save the restaurant
    await restaurant.save();

    return NextResponse.json({ 
      success: true, 
      restaurant: restaurant.toObject(),
      message: 'Restaurant updated successfully'
    });

  } catch (error) {
    console.error('Error updating restaurant:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
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