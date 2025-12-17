// app/api/restaurants/tables/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['restaurant_owner', 'waiter'].includes(session.user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let restaurant;
    
    if (session.user.role === 'restaurant_owner') {
      restaurant = await Restaurant.findOne({ ownerId: session.user.id });
    } else if (session.user.role === 'waiter') {
      const waiter = await User.findById(session.user.id).select('restaurantId');
      if (!waiter || !waiter.restaurantId) {
        return Response.json({ error: 'Waiter not assigned to a restaurant' }, { status: 400 });
      }
      restaurant = await Restaurant.findById(waiter.restaurantId);
    }

    if (!restaurant) {
      return Response.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Calculate total and available tables from the tables array
    const totalTables = restaurant.tables ? restaurant.tables.length : 0;
    const availableTables = restaurant.tables ? 
      restaurant.tables.filter(table => table.status === 'available').length : 0;

    return Response.json({ 
      success: true,
      tables: {
        total: totalTables,
        available: availableTables
      }
    });

  } catch (error) {
    console.error('Error fetching table info:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['restaurant_owner', 'waiter'].includes(session.user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { availableTables } = await request.json();

    if (availableTables === undefined || availableTables < 0) {
      return Response.json({ error: 'Invalid available tables value' }, { status: 400 });
    }

    await dbConnect();

    let restaurant;
    
    if (session.user.role === 'restaurant_owner') {
      restaurant = await Restaurant.findOne({ ownerId: session.user.id });
    } else if (session.user.role === 'waiter') {
      const waiter = await User.findById(session.user.id).select('restaurantId');
      if (!waiter || !waiter.restaurantId) {
        return Response.json({ error: 'Waiter not assigned to a restaurant' }, { status: 400 });
      }
      restaurant = await Restaurant.findById(waiter.restaurantId);
    }

    if (!restaurant) {
      return Response.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // With the new tables array structure, we need a different approach
    // This endpoint might not be needed anymore with the new visual system
    // For backward compatibility, we'll update the available count
    // but note: this is now calculated from table statuses
    
    return Response.json({ 
      success: true,
      message: 'Table availability is now managed via individual table status',
      note: 'Use the detailed endpoint for individual table management'
    });

  } catch (error) {
    console.error('Error updating tables:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}