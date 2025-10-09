import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import MenuCategory from '@/models/MenuCategory';

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
    
    // Fetch categories for the specific restaurant
    const categories = await MenuCategory.find({ restaurantId: id }).sort({ order: 1 });
    
    return new Response(JSON.stringify({ categories }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}