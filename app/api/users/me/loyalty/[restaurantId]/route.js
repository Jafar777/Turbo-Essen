// app/api/users/me/loyalty/[restaurantId]/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Order from '@/models/Order';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurantId } = await params;
    
    await dbConnect();

    // Count user's delivered orders for this restaurant
    const orderCount = await Order.countDocuments({
      userId: session.user.id,
      restaurantId: restaurantId,
      status: 'delivered'
    });

    // Get user's loyalty stats from User model if available
    const user = await User.findById(session.user.id);
    let userLoyaltyStat = null;
    
    if (user && user.loyaltyStats) {
      userLoyaltyStat = user.loyaltyStats.find(
        stat => stat.restaurantId.toString() === restaurantId
      );
    }

    return NextResponse.json({
      success: true,
      orderCount,
      userLoyalty: userLoyaltyStat || {
        orderCount: orderCount,
        earnedDiscounts: []
      }
    });

  } catch (error) {
    console.error('Error fetching user loyalty:', error);
    return NextResponse.json({ error: 'Failed to fetch loyalty data' }, { status: 500 });
  }
}