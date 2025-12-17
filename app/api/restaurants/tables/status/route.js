// app/api/restaurants/tables/status/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'waiter') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { tableId, status } = await req.json();

    if (!tableId || !status) {
      return Response.json({ error: 'Table ID and status are required' }, { status: 400 });
    }

    // Get waiter's restaurantId from User model
    const waiter = await User.findById(session.user.id).select('restaurantId');
    
    if (!waiter || !waiter.restaurantId) {
      return Response.json({ error: 'Waiter not assigned to a restaurant' }, { status: 400 });
    }

    // Get restaurant
    const restaurant = await Restaurant.findOne({ _id: waiter.restaurantId });
    
    if (!restaurant) {
      return Response.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // If restaurant doesn't have tables array, create it first
    if (!restaurant.tables || restaurant.tables.length === 0) {
      restaurant.tables = Array.from({ length: restaurant.totalTables || 10 }, (_, i) => ({
        number: i + 1,
        chairs: 4,
        status: 'available',
        section: 'main'
      }));
    }

    // Update the table's status
    const tableIndex = restaurant.tables.findIndex(table => table.number === parseInt(tableId));
    
    if (tableIndex === -1) {
      // Create the table if it doesn't exist
      restaurant.tables.push({
        number: parseInt(tableId),
        chairs: 4,
        status: status,
        section: 'main'
      });
    } else {
      restaurant.tables[tableIndex].status = status;
    }

    await restaurant.save();

    // Map 'cleaning' back to 'unavailable' for the response
    const displayStatus = status === 'cleaning' ? 'unavailable' : status;

    return Response.json({ 
      success: true,
      message: `Table ${tableId} status updated to ${displayStatus}`,
      table: {
        id: parseInt(tableId),
        status: displayStatus // Return the display status for the frontend
      }
    });

  } catch (error) {
    console.error('Error updating table status:', error);
    
    // Return more specific error message
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
      return Response.json({ 
        error: 'Validation failed',
        details: validationErrors,
        suggestion: 'Update Restaurant model to include "unavailable" in TableSchema status enum'
      }, { status: 400 });
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}