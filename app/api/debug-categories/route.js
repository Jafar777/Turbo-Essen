import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import MenuCategory from '@/models/MenuCategory';

export async function POST(request) {
  try {
    const requestData = await request.json();
    console.log('DEBUG Category Creation Request:', {
      timestamp: new Date().toISOString(),
      body: requestData,
      headers: Object.fromEntries(request.headers)
    });

    // Check for existing categories
    const existingCategories = await MenuCategory.find({
      restaurantId: requestData.restaurantId
    });
    
    console.log(`DEBUG: Found ${existingCategories.length} existing categories for restaurant ${requestData.restaurantId}`);
    
    return new Response(JSON.stringify({ 
      existingCount: existingCategories.length,
      existingCategories: existingCategories.map(cat => ({ id: cat._id, name: cat.name }))
    }), { status: 200 });
    
  } catch (error) {
    console.error('Debug error:', error);
    return new Response(JSON.stringify({ error: 'Debug failed' }), { status: 500 });
  }
}