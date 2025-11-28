// app/api/restaurants/available-tables/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    await dbConnect();

    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 });
    }

    // Generate available tables data
    const tables = [];
    for (let i = 1; i <= restaurant.totalTables; i++) {
      tables.push({
        tableNumber: i,
        status: i <= restaurant.availableTables ? 'available' : 'occupied'
      });
    }

    return NextResponse.json({ 
      success: true, 
      tables 
    });

  } catch (error) {
    console.error('Error fetching available tables:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch available tables' }, { status: 500 });
  }
}