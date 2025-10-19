// app/api/reviews/reviewable-orders/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import Review from '@/models/Review';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'user') {
      return NextResponse.json({ error: 'Only customers can access this' }, { status: 403 });
    }

    await dbConnect();

    // Get delivered orders that haven't been reviewed yet
    const deliveredOrders = await Order.find({
      userId: session.user.id,
      status: 'delivered'
    }).populate('restaurantId', 'name avatar');

    // Check which orders already have reviews
    const ordersWithReviews = await Review.find({
      userId: session.user.id
    }).select('orderId');

    const reviewedOrderIds = new Set(ordersWithReviews.map(r => r.orderId.toString()));

    // Filter out orders that already have reviews
    const reviewableOrders = deliveredOrders.filter(order => 
      !reviewedOrderIds.has(order._id.toString())
    );

    return NextResponse.json({ 
      success: true, 
      orders: reviewableOrders 
    });

  } catch (error) {
    console.error('Error fetching reviewable orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviewable orders' }, 
      { status: 500 }
    );
  }
}