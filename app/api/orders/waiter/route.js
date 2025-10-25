// app/api/orders/waiter/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';

// GET: Fetch dine-in orders for waiter
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'waiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find which restaurant the waiter works at
    const waiter = await User.findById(session.user.id).select('restaurantId');
    
    if (!waiter || !waiter.restaurantId) {
      return NextResponse.json({ 
        success: true, 
        orders: [] 
      });
    }

    // Waiters see dine-in orders for their restaurant
    const orders = await Order.find({ 
      restaurantId: waiter.restaurantId,
      orderType: 'dine_in',
      status: { $in: ['pending', 'accepted', 'preparing', 'served'] }
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email');

    return NextResponse.json({ 
      success: true, 
      orders 
    });

  } catch (error) {
    console.error('Error fetching waiter orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' }, 
      { status: 500 }
    );
  }
}

// PUT: Update order status (mark as served)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'waiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, action } = await request.json();

    if (!orderId || !action) {
      return NextResponse.json(
        { error: 'Order ID and action are required' }, 
        { status: 400 }
      );
    }

    await dbConnect();

    // Find which restaurant the waiter works at
    const waiter = await User.findById(session.user.id).select('restaurantId');
    
    if (!waiter || !waiter.restaurantId) {
      return NextResponse.json({ error: 'Waiter not assigned to a restaurant' }, { status: 400 });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' }, 
        { status: 404 }
      );
    }

    // Verify order belongs to waiter's restaurant
    if (order.restaurantId.toString() !== waiter.restaurantId.toString()) {
      return NextResponse.json(
        { error: 'Access denied' }, 
        { status: 403 }
      );
    }

    // Verify it's a dine-in order
    if (order.orderType !== 'dine_in') {
      return NextResponse.json(
        { error: 'Only dine-in orders can be managed by waiters' }, 
        { status: 400 }
      );
    }

    let newStatus;
    let message;

    if (action === 'mark_served') {
      newStatus = 'served';
      message = 'Order marked as served';
    } else if (action === 'mark_paid') {
      newStatus = 'delivered'; // Use delivered to indicate paid and completed
      message = 'Order marked as paid and completed';
      
      // Free up the table when order is paid
      const restaurant = await Restaurant.findById(waiter.restaurantId);
      if (restaurant && restaurant.availableTables < restaurant.totalTables) {
        restaurant.availableTables += 1;
        await restaurant.save();
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action' }, 
        { status: 400 }
      );
    }

    order.status = newStatus;
    await order.save();

    return NextResponse.json({ 
      success: true, 
      message,
      order 
    });

  } catch (error) {
    console.error('Error updating waiter order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' }, 
      { status: 500 }
    );
  }
}