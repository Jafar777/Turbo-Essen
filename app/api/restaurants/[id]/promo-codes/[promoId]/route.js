import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Correctly await params for both id and promoId
    const { id, promoId } = await params;
    const updateData = await request.json();
    
    await dbConnect();

    // Update specific promo code within the array
    const updatedRestaurant = await Restaurant.findOneAndUpdate(
      { _id: id, "promoCodes._id": promoId },
      { 
        $set: {
          "promoCodes.$.code": updateData.code,
          "promoCodes.$.discountType": updateData.discountType,
          "promoCodes.$.discountValue": updateData.discountValue,
          "promoCodes.$.isActive": updateData.isActive,
          "promoCodes.$.validUntil": updateData.validUntil,
          "promoCodes.$.usageLimit": updateData.usageLimit
        }
      },
      { new: true }
    );

    if (!updatedRestaurant) {
      return NextResponse.json({ error: 'Restaurant or promo code not found' }, { status: 404 });
    }

    return NextResponse.json({ restaurant: updatedRestaurant }, { status: 200 });
  } catch (error) {
    console.error('Error updating promo code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Correctly await params for both id and promoId
    const { id, promoId } = await params;
    
    await dbConnect();

    // Remove the promo code from the array
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      { $pull: { promoCodes: { _id: promoId } } },
      { new: true }
    );

    if (!updatedRestaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Promo code deleted successfully',
      restaurant: updatedRestaurant 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

