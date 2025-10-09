// /app/api/subcategories/[id]/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import SubCategory from '@/models/SubCategory';
import MenuItem from '@/models/MenuItem';



// Optional: Get a specific subcategory
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params; // This gets the restaurant ID
    
    await dbConnect();
    
    // Fetch subcategories for the specific restaurant
    const subCategories = await SubCategory.find({ restaurantId: id });
    
    return new Response(JSON.stringify({ subCategories }), { status: 200 });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}