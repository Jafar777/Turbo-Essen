// /Users/jafar/Desktop/turboessen/app/api/dashboard/stats/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';
import Review from '@/models/Review';
import Application from '@/models/Application';
import Report from '@/models/Report';

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
    const timeframe = searchParams.get('timeframe') || 'month';

    let stats = {};
    const now = new Date();
    let startDate;

    // Calculate start date based on timeframe
    switch (timeframe) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    if (session.user.role === 'admin') {
      // Admin statistics - FIXED REVENUE CALCULATION
      const [
        totalUsers,
        totalRestaurants,
        totalOrders,
        totalRevenueAggregation, // Changed this
        pendingApplications,
        pendingReports,
        recentUsers,
        recentOrders
      ] = await Promise.all([
        User.countDocuments(),
        Restaurant.countDocuments({ isActive: true }),
        Order.countDocuments({ createdAt: { $gte: startDate } }),
        // FIXED: Use aggregation for revenue to match restaurants management page
        Order.aggregate([
          { 
            $match: { 
              status: 'delivered',
              createdAt: { $gte: startDate }
            }
          },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$total' } 
            } 
          }
        ]),
        Application.countDocuments({ status: 'pending' }),
        Report.countDocuments({ status: 'pending' }),
        User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email createdAt'),
        Order.find().sort({ createdAt: -1 }).limit(5)
          .populate('userId', 'firstName lastName')
          .populate('restaurantId', 'name')
      ]);

      // FIXED: Extract revenue from aggregation result
      const totalRevenue = totalRevenueAggregation.length > 0 ? totalRevenueAggregation[0].total : 0;

      stats = {
        totalUsers,
        totalRestaurants,
        totalOrders: totalOrders || 0,
        totalRevenue: totalRevenue, // Use the corrected revenue
        pendingApplications,
        pendingReports,
        recentUsers,
        recentOrders: recentOrders.map(order => ({
          _id: order._id,
          total: order.total,
          status: order.status,
          userName: order.userId ? `${order.userId.firstName} ${order.userId.lastName}` : 'Unknown User',
          restaurantName: order.restaurantId?.name || 'Unknown Restaurant',
          createdAt: order.createdAt
        })),
        role: 'admin'
      };
    } else if (session.user.role === 'restaurant_owner') {
      // Find the restaurant owned by this user
      const restaurant = await Restaurant.findOne({ ownerId: session.user.id });
      
      if (restaurant) {
        const [
          totalOrders,
          totalRevenueAggregation, // Changed this
          averageRating,
          pendingOrders,
          recentOrders
        ] = await Promise.all([
          Order.countDocuments({ 
            restaurantId: restaurant._id,
            createdAt: { $gte: startDate }
          }),
          // FIXED: Use aggregation for restaurant revenue
          Order.aggregate([
            { 
              $match: { 
                restaurantId: restaurant._id,
                status: 'delivered',
                createdAt: { $gte: startDate }
              }
            },
            { 
              $group: { 
                _id: null, 
                total: { $sum: '$total' } 
              } 
            }
          ]),
          Review.aggregate([
            { $match: { restaurantId: restaurant._id } },
            { $group: { _id: null, average: { $avg: '$rating' } } }
          ]),
          Order.countDocuments({ 
            restaurantId: restaurant._id,
            status: { $in: ['pending', 'accepted', 'preparing'] }
          }),
          Order.find({ 
            restaurantId: restaurant._id 
          })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'firstName lastName')
        ]);

        // FIXED: Extract revenue from aggregation result
        const totalRevenue = totalRevenueAggregation.length > 0 ? totalRevenueAggregation[0].total : 0;

        stats = {
          totalOrders: totalOrders || 0,
          totalRevenue: totalRevenue, // Use the corrected revenue
          averageRating: averageRating[0]?.average || 0,
          pendingOrders,
          restaurantName: restaurant.name,
          recentOrders: recentOrders.map(order => ({
            _id: order._id,
            total: order.total,
            status: order.status,
            userName: order.userId ? `${order.userId.firstName} ${order.userId.lastName}` : 'Unknown User',
            orderType: order.orderType,
            createdAt: order.createdAt
          })),
          role: 'restaurant_owner'
        };
      }
    } else if (session.user.role === 'user') {
      const [
        totalOrders,
        pendingOrders,
        totalReviews,
        cartItems,
        userRevenueAggregation // Added for user revenue
      ] = await Promise.all([
        Order.countDocuments({ userId: session.user.id }),
        Order.countDocuments({ 
          userId: session.user.id,
          status: { $in: ['pending', 'accepted', 'preparing', 'on_the_way'] }
        }),
        Review.countDocuments({ userId: session.user.id }),
        // Get cart item count from the cart API
        fetch(`${process.env.NEXTAUTH_URL}/api/cart`, {
          headers: {
            'Cookie': request.headers.get('cookie')
          }
        }).then(res => res.json()).then(data => data.itemCount || 0).catch(() => 0),
        // FIXED: Add user spending calculation
        Order.aggregate([
          { 
            $match: { 
              userId: session.user.id,
              status: 'delivered',
              createdAt: { $gte: startDate }
            }
          },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$total' } 
            } 
          }
        ])
      ]);

      // FIXED: Extract user spending from aggregation
      const totalSpending = userRevenueAggregation.length > 0 ? userRevenueAggregation[0].total : 0;

      stats = {
        totalOrders,
        pendingOrders,
        totalReviews,
        cartItems,
        totalSpending, // Add user spending to stats
        role: 'user'
      };
    }

    return new Response(JSON.stringify({ 
      success: true,
      stats,
      timeframe
    }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}