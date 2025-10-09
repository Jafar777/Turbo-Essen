import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    await dbConnect();
    
    const restaurant = await Restaurant.findById(id).select('promoCodes');
    
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    
    return NextResponse.json({ promoCodes: restaurant.promoCodes || [] });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const newPromoCode = await request.json();
    
    await dbConnect();

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      { $push: { promoCodes: newPromoCode } },
      { new: true }
    );

    if (!updatedRestaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({ restaurant: updatedRestaurant }, { status: 201 });
  } catch (error) {
    console.error('Error adding promo code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}