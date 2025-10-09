// /app/api/subcategories/[id]/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import SubCategory from '@/models/SubCategory';
import MenuItem from '@/models/MenuItem';

// Update a specific subcategory
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params; // Get the subcategory ID from the URL
    const { name, description } = await request.json();
    
    await dbConnect();

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!updatedSubCategory) {
      return new Response(JSON.stringify({ error: 'Subcategory not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ subCategory: updatedSubCategory }), { status: 200 });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// Delete a specific subcategory
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;
    
    await dbConnect();

    await MenuItem.updateMany(
      { subCategoryId: id },
      { $unset: { subCategoryId: "" } }
    );
    
    await SubCategory.findByIdAndDelete(id);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Subcategory deleted successfully'
    }), { status: 200 });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// Get a specific subcategory (optional)
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params; // This gets the subcategory ID
    
    await dbConnect();
    
    const subCategory = await SubCategory.findById(id);
    
    if (!subCategory) {
      return new Response(JSON.stringify({ error: 'Subcategory not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ subCategory }), { status: 200 });
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}