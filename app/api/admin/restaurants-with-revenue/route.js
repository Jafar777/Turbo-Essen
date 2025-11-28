// /Users/jafar/Desktop/turboessen/app/api/admin/restaurants-with-revenue/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await dbConnect();

    // Aggregate restaurants with their revenue from orders
    const restaurantsWithRevenue = await Restaurant.aggregate([
      {
        $lookup: {
          from: 'orders', // assuming your orders collection is named 'orders'
          localField: '_id',
          foreignField: 'restaurantId',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalRevenue: {
            $sum: {
              $map: {
                input: '$orders',
                as: 'order',
                in: {
                  $cond: [
                    { $eq: ['$$order.status', 'delivered'] },
                    '$$order.total',
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          address: 1,
          phone: 1,
          cuisineType: 1,
          isActive: 1,
          avatar: 1,
          banner: 1,
          slug: 1,
          averageRating: 1,
          totalReviews: 1,
          totalRevenue: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    return new Response(JSON.stringify({ 
      success: true,
      restaurants: restaurantsWithRevenue 
    }), { status: 200 });

  } catch (error) {
    console.error('Error fetching restaurants with revenue:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}