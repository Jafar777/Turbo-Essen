// app/api/notifications/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    const notifications = await Notification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({ 
      userId: session.user.id, 
      read: false 
    });

    return new Response(JSON.stringify({ notifications, unreadCount }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { notificationId, markAllAsRead } = await request.json();
    
    await dbConnect();

    if (markAllAsRead) {
      // Mark all user's notifications as read
      await Notification.updateMany(
        { userId: session.user.id, read: false },
        { $set: { read: true } }
      );
    } else if (notificationId) {
      // Mark single notification as read
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    }

    const unreadCount = await Notification.countDocuments({ 
      userId: session.user.id, 
      read: false 
    });

    return new Response(JSON.stringify({ 
      message: 'Notifications updated successfully',
      unreadCount 
    }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}