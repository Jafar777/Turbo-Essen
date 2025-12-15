// /app/api/orders/mark-read/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only restaurant owners should use this
    if (session.user.role !== 'restaurant_owner') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Set a cookie with the current timestamp
    const response = NextResponse.json({
      success: true,
      message: 'Orders marked as read'
    });

    // Set cookie that expires in 30 days
    response.cookies.set('orders_last_read', new Date().toISOString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return response;

  } catch (error) {
    console.error('Error marking orders as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark orders as read' },
      { status: 500 }
    );
  }
}