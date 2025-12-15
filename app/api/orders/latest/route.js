// /app/api/orders/latest/route.js
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

    if (session.user.role !== 'restaurant_owner') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();

    const restaurant = await Restaurant.findOne({ ownerId: session.user.id });

    if (!restaurant) {
      return NextResponse.json({
        success: true,
        orders: []
      });
    }

    // Get last 10 orders
    const orders = await Order.find({ restaurantId: restaurant._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('createdAt status');

    return NextResponse.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Error fetching latest orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest orders' },
      { status: 500 }
    );
  }
}