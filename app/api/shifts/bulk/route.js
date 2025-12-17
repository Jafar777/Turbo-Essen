// app/api/shifts/bulk/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Shift from '@/models/Shift';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';

// POST: Create multiple shifts at once
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['restaurant_owner', 'admin'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await dbConnect();

    const { shifts, restaurantId } = await request.json();

    // Verify restaurant ownership
    const restaurant = await Restaurant.findOne({ 
      _id: restaurantId,
      ownerId: session.user.role === 'restaurant_owner' ? session.user.id : { $exists: true }
    });
    
    if (!restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found or unauthorized' }), { status: 404 });
    }

    const createdShifts = [];
    const errors = [];

    for (const shiftData of shifts) {
      try {
        // Get employee details
        const employee = await User.findById(shiftData.employeeId);
        if (!employee) {
          errors.push(`Employee not found: ${shiftData.employeeId}`);
          continue;
        }

        // Check for conflicts
        const hasConflict = await Shift.checkConflict(
          shiftData.employeeId,
          new Date(shiftData.shiftDate),
          shiftData.startTime,
          shiftData.endTime
        );

        if (hasConflict) {
          errors.push(`Conflict for ${employee.firstName} ${employee.lastName} on ${shiftData.shiftDate}`);
          continue;
        }

        const shift = await Shift.create({
          ...shiftData,
          restaurantId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          createdBy: session.user.id,
          lastModifiedBy: session.user.id
        });

        createdShifts.push(shift);

      } catch (error) {
        errors.push(`Error creating shift: ${error.message}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      createdShifts,
      errors,
      message: `Created ${createdShifts.length} shifts, ${errors.length} errors`
    }), { status: 201 });

  } catch (error) {
    console.error('Error creating bulk shifts:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// PUT: Update multiple shifts
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['restaurant_owner', 'admin'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await dbConnect();

    const { shiftIds, updates } = await request.json();

    // Verify all shifts belong to restaurants owned by the user
    const shifts = await Shift.find({ _id: { $in: shiftIds } });
    
    if (session.user.role === 'restaurant_owner') {
      const restaurantIds = [...new Set(shifts.map(s => s.restaurantId.toString()))];
      
      for (const restaurantId of restaurantIds) {
        const restaurant = await Restaurant.findOne({ 
          _id: restaurantId,
          ownerId: session.user.id
        });
        
        if (!restaurant) {
          return new Response(JSON.stringify({ 
            error: 'Unauthorized to modify shifts from this restaurant'
          }), { status: 403 });
        }
      }
    }

    // Update shifts
    const result = await Shift.updateMany(
      { _id: { $in: shiftIds } },
      {
        ...updates,
        lastModifiedBy: session.user.id
      }
    );

    return new Response(JSON.stringify({ 
      success: true,
      updatedCount: result.modifiedCount,
      message: `Updated ${result.modifiedCount} shifts`
    }), { status: 200 });

  } catch (error) {
    console.error('Error updating bulk shifts:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}