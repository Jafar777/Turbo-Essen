// app/api/restaurants/tables/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['restaurant_owner', 'waiter'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await dbConnect();

    let restaurant;
    
    if (session.user.role === 'restaurant_owner') {
      restaurant = await Restaurant.findOne({ ownerId: session.user.id });
    } else if (session.user.role === 'waiter') {
      const waiter = await User.findById(session.user.id).select('restaurantId');
      if (!waiter || !waiter.restaurantId) {
        return new Response(JSON.stringify({ error: 'Waiter not assigned to a restaurant' }), { status: 400 });
      }
      restaurant = await Restaurant.findById(waiter.restaurantId);
    }

    if (!restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ 
      success: true,
      tables: {
        total: restaurant.totalTables,
        available: restaurant.availableTables
      }
    }), { status: 200 });

  } catch (error) {
    console.error('Error fetching table info:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['restaurant_owner', 'waiter'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { availableTables } = await request.json();

    if (availableTables === undefined || availableTables < 0) {
      return new Response(JSON.stringify({ error: 'Invalid available tables value' }), { status: 400 });
    }

    await dbConnect();

    let restaurant;
    
    if (session.user.role === 'restaurant_owner') {
      restaurant = await Restaurant.findOne({ ownerId: session.user.id });
    } else if (session.user.role === 'waiter') {
      const waiter = await User.findById(session.user.id).select('restaurantId');
      if (!waiter || !waiter.restaurantId) {
        return new Response(JSON.stringify({ error: 'Waiter not assigned to a restaurant' }), { status: 400 });
      }
      restaurant = await Restaurant.findById(waiter.restaurantId);
    }

    if (!restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found' }), { status: 404 });
    }

    // Validate that available tables doesn't exceed total tables
    if (availableTables > restaurant.totalTables) {
      return new Response(JSON.stringify({ 
        error: `Available tables cannot exceed total tables (${restaurant.totalTables})` 
      }), { status: 400 });
    }

    restaurant.availableTables = availableTables;
    await restaurant.save();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Available tables updated successfully',
      tables: {
        total: restaurant.totalTables,
        available: restaurant.availableTables
      }
    }), { status: 200 });

  } catch (error) {
    console.error('Error updating tables:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}