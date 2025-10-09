import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import MenuCategory from '@/models/MenuCategory';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { name, description, restaurantId, order, isActive } = await request.json();
    
    await dbConnect();

    // Check for existing category with same name in the same restaurant
    const existingCategory = await MenuCategory.findOne({
      restaurantId: restaurantId,
      name: name
    });

    if (existingCategory) {
      return new Response(JSON.stringify({ 
        error: 'Category with this name already exists for this restaurant' 
      }), {
        status: 400,
      });
    }

    const newCategory = new MenuCategory({
      name,
      description: description || '',
      restaurantId,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    await newCategory.save();

    return new Response(JSON.stringify({ category: newCategory }), {
      status: 201,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}