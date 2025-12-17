// app/api/restaurants/tables/detailed/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';
import User from '@/models/User'; // Add this import
import dbConnect from '@/lib/dbConnect';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Session in detailed route:', JSON.stringify(session, null, 2)); // Debug
    
    if (!session || session.user?.role !== 'waiter') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get waiter's restaurantId from User model
    const waiter = await User.findById(session.user.id).select('restaurantId');
    console.log('Waiter found:', waiter); // Debug
    
    if (!waiter || !waiter.restaurantId) {
      return Response.json({ error: 'Waiter not assigned to a restaurant' }, { status: 400 });
    }

    // Get restaurant where waiter works
    const restaurant = await Restaurant.findOne({ _id: waiter.restaurantId });
    
    if (!restaurant) {
      return Response.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    console.log('Restaurant found:', restaurant.name); // Debug

    // If restaurant doesn't have tables array, create default tables
    if (!restaurant.tables || restaurant.tables.length === 0) {
      // Create default tables (10 tables with 4 chairs each)
      restaurant.tables = Array.from({ length: restaurant.totalTables || 10 }, (_, i) => ({
        number: i + 1,
        chairs: 4,
        status: 'available',
        section: 'main'
      }));
      await restaurant.save();
    }

    // Get active dine-in orders
    const orders = await Order.find({
      restaurantId: restaurant._id,
      orderType: 'dine_in',
      status: { $in: ['pending', 'accepted', 'preparing', 'served'] }
    }).sort({ createdAt: -1 });

    // Merge tables with orders
    const tables = restaurant.tables.map(table => {
      const tableOrders = orders.filter(order => order.tableNumber === table.number);
      
      return {
        id: table.number,
        number: table.number,
        chairs: table.chairs,
        status: tableOrders.length > 0 ? 'occupied' : table.status,
        orders: tableOrders,
        section: table.section
      };
    });

    // Calculate stats
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const availableTables = tables.filter(t => t.status === 'available').length;

    return Response.json({ 
      tables,
      stats: {
        total: tables.length,
        available: availableTables,
        occupied: occupiedTables
      }
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'waiter') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { tableId, chairs } = await req.json();

    if (!tableId || chairs === undefined) {
      return Response.json({ error: 'Table ID and chairs are required' }, { status: 400 });
    }

    if (chairs < 2 || chairs > 8) {
      return Response.json({ error: 'Chairs must be between 2 and 8' }, { status: 400 });
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

    // Update the table's chairs
    const tableIndex = restaurant.tables.findIndex(table => table.number === parseInt(tableId));
    
    if (tableIndex === -1) {
      // Create the table if it doesn't exist
      restaurant.tables.push({
        number: parseInt(tableId),
        chairs: chairs,
        status: 'available',
        section: 'main'
      });
    } else {
      restaurant.tables[tableIndex].chairs = chairs;
    }

    await restaurant.save();

    return Response.json({ 
      success: true,
      message: `Table ${tableId} updated to ${chairs} chairs`,
      table: {
        id: parseInt(tableId),
        chairs: chairs
      }
    });

  } catch (error) {
    console.error('Error updating table:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}