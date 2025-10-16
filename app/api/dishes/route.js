// /app/api/dishes/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import MenuItem from '@/models/MenuItem';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      description,
      price,
      categoryId,
      subCategoryId,
      restaurantId,
      image,
      ingredients,
      dietaryInfo,
      promoCode
    } = await request.json();
    
    await dbConnect();
    const cleanedSubCategoryId = subCategoryId === "" ? undefined : subCategoryId;

    const newDish = new MenuItem({
      name,
      description,
      price,
      categoryId,
      subCategoryId: cleanedSubCategoryId, // Use the cleaned value
      restaurantId,
      image,
      ingredients: ingredients || [],
      dietaryInfo: dietaryInfo || {
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false
      },
      promoCode: promoCode || {
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        isActive: false
      }
    });

    await newDish.save();

    return NextResponse.json({ dish: newDish }, { status: 201 });
  } catch (error) {
    console.error('Error creating dish:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Optional: Get all dishes (if needed)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    
    await dbConnect();
    
    const query = restaurantId ? { restaurantId } : {};
    const dishes = await MenuItem.find(query);
    
    return NextResponse.json({ dishes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching dishes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
