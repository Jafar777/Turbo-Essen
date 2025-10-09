// /app/api/subcategories/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import SubCategory from '@/models/SubCategory';
import MenuItem from '@/models/MenuItem';

// Get all subcategories or create a new one
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await dbConnect();
    
    // Optional: Get subcategories for a specific category
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    
    const query = categoryId ? { categoryId } : {};
    const subCategories = await SubCategory.find(query);
    
    return new Response(JSON.stringify({ subCategories }), { status: 200 });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// Create a new subcategory
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { name, description, categoryId, restaurantId } = await request.json();
    
    await dbConnect();

    const newSubCategory = new SubCategory({
      name,
      description,
      categoryId,
      restaurantId
    });

    await newSubCategory.save();

    return new Response(JSON.stringify({ subCategory: newSubCategory }), { status: 201 });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}