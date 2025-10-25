// app/api/orders/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';

// GET: Fetch orders based on user role
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let orders;

    if (session.user.role === 'restaurant_owner') {
      // Find the restaurant owned by this user
      const restaurant = await Restaurant.findOne({ ownerId: session.user.id });

      if (!restaurant) {
        return NextResponse.json({
          success: true,
          orders: []
        });
      }

      // Get orders for this specific restaurant
      orders = await Order.find({ restaurantId: restaurant._id })
        .sort({ createdAt: -1 })
        .populate('userId', 'firstName lastName email');
    } else if (session.user.role === 'chef') {
      // Find which restaurant the chef works at
      const chef = await User.findById(session.user.id).select('restaurantId');

      if (!chef || !chef.restaurantId) {
        return NextResponse.json({
          success: true,
          orders: []
        });
      }

      // Chefs only see accepted and preparing orders for their restaurant
      orders = await Order.find({
        restaurantId: chef.restaurantId,
        status: { $in: ['accepted', 'preparing'] }
      })
        .sort({ createdAt: -1 })
        .populate('userId', 'firstName lastName email');
    } else if (session.user.role === 'waiter') {
      // Find which restaurant the waiter works at
      const waiter = await User.findById(session.user.id).select('restaurantId');
      
      if (!waiter || !waiter.restaurantId) {
        return NextResponse.json({ 
          success: true, 
          orders: [] 
        });
      }

      // Waiters see dine-in orders for their restaurant
      orders = await Order.find({ 
        restaurantId: waiter.restaurantId,
        orderType: 'dine_in',
        status: { $in: ['pending', 'accepted', 'preparing', 'served'] }
      })
        .sort({ createdAt: -1 })
        .populate('userId', 'firstName lastName email');
    } else if (session.user.role === 'delivery') {
      // Find which restaurant the delivery person works at
      const deliveryPerson = await User.findById(session.user.id).select('restaurantId');

      if (!deliveryPerson || !deliveryPerson.restaurantId) {
        return NextResponse.json({
          success: true,
          orders: []
        });
      }

      // Delivery persons see delivery orders that are on the way or delivered for their restaurant
      orders = await Order.find({
        restaurantId: deliveryPerson.restaurantId,
        orderType: 'delivery',
        status: { $in: ['on_the_way', 'delivered'] }
      })
        .sort({ createdAt: -1 })
        .populate('userId', 'firstName lastName email');
    } else if (session.user.role === 'user') {
      // Users see their own orders
      orders = await Order.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .populate('restaurantId', 'name');
    } else if (session.user.role === 'admin') {
      // Admins see all orders
      orders = await Order.find()
        .sort({ createdAt: -1 })
        .populate('userId', 'firstName lastName email')
        .populate('restaurantId', 'name');
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST: Create a new order
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'user') {
      return NextResponse.json({ error: 'Only customers can place orders' }, { status: 403 });
    }

    const { paymentMethod, items, total, specialInstructions, orderType, tableNumber, deliveryLocation } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Validate table number for dine-in orders
    if (orderType === 'dine_in' && !tableNumber) {
      return NextResponse.json(
        { error: 'Table number is required for dine-in orders' },
        { status: 400 }
      );
    }

    // Validate delivery location for delivery orders
    if (orderType === 'delivery' && !deliveryLocation) {
      return NextResponse.json(
        { error: 'Delivery location is required for delivery orders' },
        { status: 400 }
      );
    }

    // All items should be from the same restaurant
    const restaurantId = items[0].restaurantId;
    const restaurantName = items[0].restaurantName;

    await dbConnect();

    const newOrder = new Order({
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      restaurantId,
      restaurantName,
      items,
      total,
      paymentMethod: paymentMethod || 'cash',
      specialInstructions: specialInstructions || '',
      orderType: orderType || 'delivery',
      tableNumber: orderType === 'dine_in' ? tableNumber : undefined,
      deliveryLocation: orderType === 'delivery' ? deliveryLocation : undefined,
      status: 'pending'
    });

    await newOrder.save();

    // Populate for response
    await newOrder.populate('restaurantId', 'name');

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      order: newOrder
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to place order' },
      { status: 500 }
    );
  }
}