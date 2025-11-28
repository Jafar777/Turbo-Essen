// /Users/jafar/Desktop/turboessen/app/api/admin/restaurants/[id]/status/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;
    const { isActive } = await request.json();

    await dbConnect();

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ 
      success: true,
      restaurant 
    }), { status: 200 });

  } catch (error) {
    console.error('Error updating restaurant status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}