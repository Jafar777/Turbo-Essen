// /app/api/dishes/[id]/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import MenuItem from '@/models/MenuItem';
import { NextResponse } from 'next/server';

// Only one PUT function
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params; // Correct for Next.js 15 :cite[3]
    console.log('Updating dish ID:', id); // Your logging
    const updateData = await request.json();
    console.log('Update data received:', updateData); // Your logging

        if (updateData.subCategoryId === "") {
      updateData.subCategoryId = undefined;
    }
    
    await dbConnect();

    const updatedDish = await MenuItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedDish) {
      console.log('Dish not found with ID:', id);
      return NextResponse.json({ error: 'Dish not found' }, { status: 404 });
    }

    console.log('Dish updated successfully:', updatedDish._id);
    return NextResponse.json({ dish: updatedDish }, { status: 200 });
  } catch (error) {
    console.error('Error updating dish:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    await dbConnect();

    const deletedDish = await MenuItem.findByIdAndDelete(id);

    if (!deletedDish) {
      return NextResponse.json({ error: 'Dish not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Dish deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting dish:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}