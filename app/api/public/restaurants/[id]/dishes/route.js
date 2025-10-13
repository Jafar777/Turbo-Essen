// app/api/public/restaurants/[id]/dishes/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MenuItem from '@/models/MenuItem';
import MenuCategory from '@/models/MenuCategory';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    await dbConnect();
    
    // Fetch dishes for the specific restaurant that are available
    const dishes = await MenuItem.find({ 
      restaurantId: id,
      isAvailable: true 
    }).populate('categoryId', 'name');
    
    return NextResponse.json({ 
      success: true, 
      dishes: dishes.map(dish => ({
        _id: dish._id.toString(),
        name: dish.name,
        description: dish.description,
        price: dish.price,
        image: dish.image,
        ingredients: dish.ingredients,
        dietaryInfo: dish.dietaryInfo,
        categoryId: dish.categoryId
      }))
    });
  } catch (error) {
    console.error('Error fetching dishes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dishes' },
      { status: 500 }
    );
  }
}