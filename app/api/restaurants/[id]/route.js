// app/api/restaurants/[id]/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;
    const updateData = await request.json();

    await dbConnect();

    // Verify the user owns this restaurant (unless admin)
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found' }), { status: 404 });
    }

    if (session.user.role !== 'admin' && restaurant.ownerId.toString() !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Update the restaurant
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return new Response(JSON.stringify({ 
      success: true, 
      restaurant: updatedRestaurant 
    }), { status: 200 });

  } catch (error) {
    console.error('Error updating restaurant:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}