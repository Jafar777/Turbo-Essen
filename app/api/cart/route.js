// app/api/cart/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Cart from '@/models/Cart';
import MenuItem from '@/models/MenuItem';

// GET: Fetch user's cart
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'user') {
      return NextResponse.json({ error: 'Only customers can access cart' }, { status: 403 });
    }

    await dbConnect();
    
    let cart = await Cart.findOne({ userId: session.user.id });
    
    if (!cart) {
      cart = new Cart({
        userId: session.user.id,
        items: [],
        total: 0
      });
      await cart.save();
    }

    // Calculate current total
    const calculatedTotal = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Update total if different
    if (cart.total !== calculatedTotal) {
      cart.total = calculatedTotal;
      await cart.save();
    }

    // Return the cart data directly, not nested in a cart object
    return NextResponse.json({ 
      success: true, 
      items: cart.items,
      total: cart.total,
      itemCount: cart.items.reduce((count, item) => count + item.quantity, 0)
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' }, 
      { status: 500 }
    );
  }
}

// POST: Add item to cart
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'user') {
      return NextResponse.json({ error: 'Only customers can add to cart' }, { status: 403 });
    }

    const { dishId, dishName, dishImage, price, restaurantId, restaurantName, quantity = 1 } = await request.json();

    // Validate required fields
    if (!dishId || !dishName || !price || !restaurantId || !restaurantName) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify the dish exists and is available
    const dish = await MenuItem.findOne({ _id: dishId, isAvailable: true });
    if (!dish) {
      return NextResponse.json(
        { error: 'Dish not found or unavailable' }, 
        { status: 404 }
      );
    }

    let cart = await Cart.findOne({ userId: session.user.id });

    if (!cart) {
      cart = new Cart({
        userId: session.user.id,
        items: [],
        total: 0
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.dishId.toString() === dishId && item.restaurantId.toString() === restaurantId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        dishId,
        dishName,
        dishImage: dishImage || dish.image,
        price,
        quantity,
        restaurantId,
        restaurantName
      });
    }

    // Calculate total
    cart.total = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    await cart.save();

    // Return the updated cart data directly
    return NextResponse.json({ 
      success: true, 
      message: 'Item added to cart',
      items: cart.items,
      total: cart.total,
      itemCount: cart.items.reduce((count, item) => count + item.quantity, 0)
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' }, 
      { status: 500 }
    );
  }
}

// PUT: Update item quantity
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'user') {
      return NextResponse.json({ error: 'Only customers can update cart' }, { status: 403 });
    }

    const { itemId, quantity } = await request.json();

    if (!itemId || quantity === undefined || quantity < 0) {
      return NextResponse.json(
        { error: 'Invalid parameters' }, 
        { status: 400 }
      );
    }

    await dbConnect();

    const cart = await Cart.findOne({ userId: session.user.id });

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' }, 
        { status: 404 }
      );
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item not found in cart' }, 
        { status: 404 }
      );
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    // Calculate total
    cart.total = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    await cart.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Cart updated successfully',
      items: cart.items,
      total: cart.total,
      itemCount: cart.items.reduce((count, item) => count + item.quantity, 0)
    });

  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'Failed to update cart' }, 
      { status: 500 }
    );
  }
}

// DELETE: Remove item or clear cart
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'user') {
      return NextResponse.json({ error: 'Only customers can modify cart' }, { status: 403 });
    }

    await dbConnect();

    const cart = await Cart.findOne({ userId: session.user.id });

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' }, 
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');

    if (itemId) {
      // Remove specific item
      const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
      
      if (itemIndex === -1) {
        return NextResponse.json(
          { error: 'Item not found in cart' }, 
          { status: 404 }
        );
      }

      cart.items.splice(itemIndex, 1);
    } else {
      // Clear entire cart
      cart.items = [];
    }

    // Calculate total
    cart.total = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    await cart.save();

    return NextResponse.json({ 
      success: true, 
      message: itemId ? 'Item removed from cart' : 'Cart cleared successfully',
      items: cart.items,
      total: cart.total,
      itemCount: cart.items.reduce((count, item) => count + item.quantity, 0)
    });

  } catch (error) {
    console.error('Error deleting from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' }, 
      { status: 500 }
    );
  }
}