// app/api/categories/[id]/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import MenuCategory from '@/models/MenuCategory';
import SubCategory from '@/models/SubCategory';
import MenuItem from '@/models/MenuItem';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id } = await params;
    
    await dbConnect();

    // First, delete all dishes in this category
    await MenuItem.deleteMany({ categoryId: id });
    
    // Delete all subcategories in this category
    await SubCategory.deleteMany({ categoryId: id });
    
    // Finally, delete the category itself
    await MenuCategory.findByIdAndDelete(id);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Category and all associated data deleted successfully'
    }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
// Add to /app/api/categories/[id]/route.js
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id } = await params;
    const { name, description } = await request.json();
    
    await dbConnect();

    const updatedCategory = await MenuCategory.findByIdAndUpdate(
      id,
      { name, description },
      { new: true } // Return the updated document
    );

    if (!updatedCategory) {
      return new Response(JSON.stringify({ error: 'Category not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ category: updatedCategory }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}