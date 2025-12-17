// app/api/users/[userId]/loyalty/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Users can only view their own loyalty stats
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(userId).select('loyaltyStats');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const restaurantLoyalty = user.loyaltyStats?.find(
      stat => stat.restaurantId.toString() === restaurantId
    ) || {
      orderCount: 0,
      lastOrderDate: null,
      earnedDiscounts: []
    };

    return NextResponse.json({
      success: true,
      orderCount: restaurantLoyalty.orderCount || 0,
      lastOrderDate: restaurantLoyalty.lastOrderDate,
      earnedDiscounts: restaurantLoyalty.earnedDiscounts || [],
      progress: restaurantLoyalty.orderCount || 0
    });

  } catch (error) {
    console.error('Error fetching user loyalty:', error);
    return NextResponse.json({ error: 'Failed to fetch loyalty data' }, { status: 500 });
  }
}