// app/api/delivery/[id]/location/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import User from '@/models/User';

// Simple in-memory store (use Redis in production for persistence)
const latestLocations = new Map();

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is delivery person
    if (!session || session.user.role !== 'delivery') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const locationData = await request.json();

    await dbConnect();

    // Verify this delivery person is assigned to this order
    const order = await Order.findById(id);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order is from the same restaurant as the delivery person
    const user = await User.findById(session.user.id).select('restaurantId');
    
    if (!user || !user.restaurantId || 
        order.restaurantId.toString() !== user.restaurantId.toString()) {
      return NextResponse.json({ error: 'Not assigned to this order' }, { status: 403 });
    }

    // Store the latest location with timestamp
    const locationWithTimestamp = {
      ...locationData,
      timestamp: Date.now(),
      orderId: id
    };
    
    latestLocations.set(id, locationWithTimestamp);
    
    // Also update in database for persistence
    await Order.findByIdAndUpdate(id, {
      $set: {
        'deliveryPersonLocation': locationData,
        'lastLocationUpdate': new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Location updated',
      timestamp: locationWithTimestamp.timestamp
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

// SSE endpoint for the customer to listen for updates
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow customers to track their own orders
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await dbConnect();
    
    const order = await Order.findById(id);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user is allowed to track this order
    if (session.user.role === 'user' && order.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Allow restaurant owners to track orders from their restaurant
    if (session.user.role === 'restaurant_owner') {
      const restaurant = await User.findOne({ ownerId: session.user.id });
      if (!restaurant || order.restaurantId.toString() !== restaurant._id.toString()) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const stream = new ReadableStream({
      start(controller) {
        // Send the current location immediately if it exists
        const currentLocation = latestLocations.get(id);
        if (currentLocation) {
          controller.enqueue(`data: ${JSON.stringify(currentLocation)}\n\n`);
        }

        // Set up an interval to check for new locations
        const intervalId = setInterval(() => {
          const location = latestLocations.get(id);
          if (location) {
            controller.enqueue(`data: ${JSON.stringify(location)}\n\n`);
          }
        }, 2000); // Check every 2 seconds

        // Clean up on client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(intervalId);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      },
    });
  } catch (error) {
    console.error('Error in SSE endpoint:', error);
    return NextResponse.json({ error: 'Failed to establish tracking' }, { status: 500 });
  }
}