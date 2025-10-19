// app/api/orders/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant'; // Add this import

// PUT: Update order status
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' }, 
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'accepted', 'preparing', 'on_the_way', 'delivered', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' }, 
        { status: 400 }
      );
    }

    await dbConnect();

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' }, 
        { status: 404 }
      );
    }

    // Check permissions
    if (session.user.role === 'restaurant_owner') {
      // Find the restaurant owned by this user
      const restaurant = await Restaurant.findOne({ ownerId: session.user.id });
      
      if (!restaurant || order.restaurantId.toString() !== restaurant._id.toString()) {
        return NextResponse.json(
          { error: 'Access denied' }, 
          { status: 403 }
        );
      }
    }

    if (session.user.role === 'user' && order.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' }, 
        { status: 403 }
      );
    }

    order.status = status;
    await order.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Order status updated',
      order 
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' }, 
      { status: 500 }
    );
  }
}

// GET: Get specific order
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const order = await Order.findById(id)
      .populate('userId', 'firstName lastName email')
      .populate('restaurantId', 'name address phone');

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' }, 
        { status: 404 }
      );
    }

    // Check permissions
    if (session.user.role === 'user' && order.userId._id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' }, 
        { status: 403 }
      );
    }

    if (session.user.role === 'restaurant_owner') {
      // Find the restaurant owned by this user
      const restaurant = await Restaurant.findOne({ ownerId: session.user.id });
      
      if (!restaurant || order.restaurantId._id.toString() !== restaurant._id.toString()) {
        return NextResponse.json(
          { error: 'Access denied' }, 
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      order 
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' }, 
      { status: 500 }
    );
  }
}