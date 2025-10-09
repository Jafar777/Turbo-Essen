// app/api/restaurants/my-restaurant/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    await dbConnect();
    
    const restaurant = await Restaurant.findOne({ ownerId: session.user.id });
    
    if (!restaurant) {
      // Create a default restaurant if none exists
      const newRestaurant = new Restaurant({
        name: `${session.user.firstName}'s Restaurant`,
        ownerId: session.user.id,
        description: 'Welcome to our restaurant!',
      });
      await newRestaurant.save();
      return new Response(JSON.stringify({ restaurant: newRestaurant }), {
        status: 200,
      });
    }

    return new Response(JSON.stringify({ restaurant }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}