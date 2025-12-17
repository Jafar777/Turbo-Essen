// app/api/orders/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';
import { sendOrderStatusEmail } from '@/lib/order-email-notifications';

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

    // Store the old status for comparison
    const oldStatus = order.status;

    // Check permissions based on role
    if (session.user.role === 'restaurant_owner') {
      // Find the restaurant owned by this user
      const restaurant = await Restaurant.findOne({ ownerId: session.user.id });
      
      if (!restaurant || order.restaurantId.toString() !== restaurant._id.toString()) {
        return NextResponse.json(
          { error: 'Access denied' }, 
          { status: 403 }
        );
      }
    } else if (session.user.role === 'chef') {
      // Chefs can only update orders for their restaurant and only from preparing to on_the_way
      const chef = await User.findById(session.user.id).select('restaurantId');
      
      if (!chef || !chef.restaurantId || order.restaurantId.toString() !== chef.restaurantId.toString()) {
        return NextResponse.json(
          { error: 'Access denied - not your restaurant' }, 
          { status: 403 }
        );
      }

      // Chefs can only change status from preparing to on_the_way
      if (order.status !== 'preparing' || status !== 'on_the_way') {
        return NextResponse.json(
          { error: 'Chefs can only mark preparing orders as finished' }, 
          { status: 403 }
        );
      }
    } else if (session.user.role === 'user' && order.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' }, 
        { status: 403 }
      );
    }

    // Update the order status
    order.status = status;
    await order.save();

    // Send email notifications for specific status changes
    if (oldStatus !== status) {
  try {
    // Get user details for email
    const user = await User.findById(order.userId).select('firstName email');
    
    if (user && ['accepted', 'on_the_way', 'delivered'].includes(status)) {
      // Convert the order to a plain JavaScript object for email function
      const orderForEmail = {
        _id: order._id.toString(), // Convert to string
        restaurantName: order.restaurantName,
        total: order.total
      };
      
      // Send email notification (don't await to avoid blocking the response)
      sendOrderStatusEmail(user.email, orderForEmail, status, user.firstName)
        .then(sent => {
          if (sent) {
            console.log(`Order status email sent for order ${order._id}, status: ${status}`);
          } else {
            console.error(`Failed to send order status email for order ${order._id}`);
          }
        })
        .catch(emailError => {
          console.error('Error in email sending:', emailError);
        });
    }
  } catch (emailError) {
    console.error('Error preparing to send email:', emailError);
    // Don't fail the request if email fails
  }
}

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

const updateUserLoyalty = async (userId, restaurantId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    let loyaltyStat = user.loyaltyStats?.find(
      stat => stat.restaurantId.toString() === restaurantId
    );

    if (!loyaltyStat) {
      loyaltyStat = {
        restaurantId,
        orderCount: 0,
        lastOrderDate: null,
        earnedDiscounts: []
      };
      if (!user.loyaltyStats) user.loyaltyStats = [];
      user.loyaltyStats.push(loyaltyStat);
    }

    loyaltyStat.orderCount += 1;
    loyaltyStat.lastOrderDate = new Date();

    // Check if user reached threshold
    const restaurant = await Restaurant.findById(restaurantId).select('loyaltySystem');
    if (restaurant?.loyaltySystem?.isActive) {
      const threshold = restaurant.loyaltySystem.ordersThreshold;
      if (loyaltyStat.orderCount >= threshold) {
        // Reset count and give discount
        loyaltyStat.orderCount = 0;
        loyaltyStat.earnedDiscounts.push({
          dateEarned: new Date(),
          discountPercentage: restaurant.loyaltySystem.discountPercentage,
          used: false
        });
      }
    }

    await user.save();
  } catch (error) {
    console.error('Error updating user loyalty:', error);
  }
};

// Call this function when an order is delivered
// In the PUT handler, after updating order status:
if (status === 'delivered') {
  updateUserLoyalty(order.userId, order.restaurantId);
}