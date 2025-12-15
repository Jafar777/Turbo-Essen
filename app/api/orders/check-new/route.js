// /app/api/orders/check-new/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only restaurant owners should use this
    if (session.user.role !== 'restaurant_owner') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();

    // Find the restaurant owned by this user
    const restaurant = await Restaurant.findOne({ ownerId: session.user.id });

    if (!restaurant) {
      return NextResponse.json({
        success: true,
        hasNewOrders: false
      });
    }

    // Get the last read timestamp from cookies or use default
    const lastReadCookie = request.cookies.get('orders_last_read');
    const lastRead = lastReadCookie ? new Date(lastReadCookie.value) : new Date(0);

    // Check for pending orders created after last read
    const newOrderCount = await Order.countDocuments({
      restaurantId: restaurant._id,
      status: 'pending',
      createdAt: { $gt: lastRead }
    });

    return NextResponse.json({
      success: true,
      hasNewOrders: newOrderCount > 0,
      newOrderCount
    });

  } catch (error) {
    console.error('Error checking new orders:', error);
    return NextResponse.json(
      { error: 'Failed to check new orders' },
      { status: 500 }
    );
  }
}