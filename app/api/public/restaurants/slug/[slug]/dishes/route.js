// app/api/public/restaurants/slug/[slug]/dishes/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MenuItem from '@/models/MenuItem';
import MenuCategory from '@/models/MenuCategory';
import Restaurant from '@/models/Restaurant';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    
    await dbConnect();
    
    // First, find the restaurant by slug to get its ID
    const restaurant = await Restaurant.findOne({ slug, isActive: true });
    
    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Fetch dishes for the specific restaurant that are available
    const dishes = await MenuItem.find({ 
      restaurantId: restaurant._id,
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