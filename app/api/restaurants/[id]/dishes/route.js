import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import MenuItem from '@/models/MenuItem';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id } = await params; // This captures the restaurant ID from the URL
    
    await dbConnect();
    
    // Fetch dishes for the specific restaurant
    const dishes = await MenuItem.find({ restaurantId: id });
    
    return new Response(JSON.stringify({ dishes }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching dishes:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}