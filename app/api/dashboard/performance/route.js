// app/api/dashboard/performance/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import Review from '@/models/Review';
import Restaurant from '@/models/Restaurant';

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

    const now = new Date();
    let startDate;

    switch (timeframe) {
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

    let performanceData = {};

// app/api/dashboard/performance/route.js
// ... existing code ...

if (session.user.role === 'admin') {
  // Admin performance data - FIXED: Only 3 aggregations, not 4
  const [ordersOverTime, topRestaurants, orderStatusDistribution] = await Promise.all([
    // Orders over time
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    // Top restaurants by revenue
    Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$restaurantId",
          totalRevenue: { $sum: "$total" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]),
    // Order status distribution
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  // Filter out any invalid restaurant IDs before querying
  const validRestaurantIds = topRestaurants
    .filter(item => item._id && typeof item._id === 'object') // Ensure it's an ObjectId
    .map(item => item._id);

  // Populate restaurant names only for valid IDs
  const restaurants = validRestaurantIds.length > 0 
    ? await Restaurant.find({ _id: { $in: validRestaurantIds } }).select('name')
    : [];

  const restaurantMap = restaurants.reduce((map, restaurant) => {
    map[restaurant._id.toString()] = restaurant.name;
    return map;
  }, {});

  performanceData = {
    ordersOverTime,
    revenueOverTime: ordersOverTime, // Same data for now
    topRestaurants: topRestaurants.map(item => ({
      name: restaurantMap[item._id] || 'Unknown Restaurant',
      revenue: item.totalRevenue,
      orders: item.orderCount
    })),
    orderStatusDistribution,
    role: 'admin'
  };
}
 else if (session.user.role === 'restaurant_owner') {
      // Restaurant owner performance data
      const restaurant = await Restaurant.findOne({ ownerId: session.user.id });
      
      if (restaurant) {
        const [ordersOverTime, revenueOverTime, popularItems, customerRatings] = await Promise.all([
          // Orders over time for this restaurant
          Order.aggregate([
            {
              $match: {
                restaurantId: restaurant._id,
                createdAt: { $gte: startDate }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                count: { $sum: 1 },
                revenue: { $sum: "$total" }
              }
            },
            { $sort: { _id: 1 } }
          ]),
          // Popular items (simplified - would need order items data)
          Order.aggregate([
            {
              $match: {
                restaurantId: restaurant._id,
                createdAt: { $gte: startDate }
              }
            },
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.dishName",
                count: { $sum: "$items.quantity" },
                revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]),
          // Customer ratings
          Review.aggregate([
            {
              $match: {
                restaurantId: restaurant._id,
                createdAt: { $gte: startDate }
              }
            },
            {
              $group: {
                _id: "$rating",
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ])
        ]);

        performanceData = {
          ordersOverTime,
          revenueOverTime,
          popularItems,
          customerRatings,
          restaurantName: restaurant.name,
          role: 'restaurant_owner'
        };
      }
    } else if (session.user.role === 'user') {
      // User performance data
      const [orderHistory, spendingOverTime, reviewHistory] = await Promise.all([
        // Order history
        Order.aggregate([
          {
            $match: {
              userId: session.user.id,
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
              },
              count: { $sum: 1 },
              totalSpent: { $sum: "$total" }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        // Review history
        Review.aggregate([
          {
            $match: {
              userId: session.user.id,
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
              },
              count: { $sum: 1 },
              averageRating: { $avg: "$rating" }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      performanceData = {
        orderHistory,
        spendingOverTime: orderHistory, // Same data for now
        reviewHistory,
        role: 'user'
      };
    }

    return new Response(JSON.stringify({ 
      success: true,
      performanceData,
      timeframe
    }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}