// app/api/shifts/[id]/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Shift from '@/models/Shift';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';

// PUT: Update shift
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['restaurant_owner', 'admin'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    await dbConnect();

    // Get existing shift
    const shift = await Shift.findById(id).populate('employeeId', 'email firstName');
    if (!shift) {
      return new Response(JSON.stringify({ error: 'Shift not found' }), { status: 404 });
    }

    // Verify restaurant ownership
    const restaurant = await Restaurant.findOne({ 
      _id: shift.restaurantId,
      ownerId: session.user.role === 'restaurant_owner' ? session.user.id : { $exists: true }
    });
    
    if (!restaurant) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    // Check for scheduling conflicts if time changed
    if (data.startTime || data.endTime || data.shiftDate) {
      const shiftDate = data.shiftDate ? new Date(data.shiftDate) : shift.shiftDate;
      const startTime = data.startTime || shift.startTime;
      const endTime = data.endTime || shift.endTime;

      const hasConflict = await Shift.checkConflict(
        shift.employeeId._id,
        shiftDate,
        startTime,
        endTime,
        id
      );
      
      if (hasConflict) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Scheduling conflict: Employee already has a shift during this time'
        }), { status: 400 });
      }
    }

    // Update shift
    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      {
        ...data,
        lastModifiedBy: session.user.id
      },
      { new: true, runValidators: true }
    ).populate('employeeId', 'firstName lastName email avatar role');

    // Notify employee if shift was modified
    if (shift.status === 'scheduled' || shift.status === 'confirmed') {
      // Send notification logic here
    }

    return new Response(JSON.stringify({ 
      success: true,
      shift: updatedShift,
      message: 'Shift updated successfully'
    }), { status: 200 });

  } catch (error) {
    console.error('Error updating shift:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// DELETE: Delete shift
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['restaurant_owner', 'admin'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // Get shift
    const shift = await Shift.findById(id);
    if (!shift) {
      return new Response(JSON.stringify({ error: 'Shift not found' }), { status: 404 });
    }

    // Verify restaurant ownership
    const restaurant = await Restaurant.findOne({ 
      _id: shift.restaurantId,
      ownerId: session.user.role === 'restaurant_owner' ? session.user.id : { $exists: true }
    });
    
    if (!restaurant) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    // Soft delete by changing status to cancelled
    await Shift.findByIdAndUpdate(id, {
      status: 'cancelled',
      lastModifiedBy: session.user.id
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Shift cancelled successfully'
    }), { status: 200 });

  } catch (error) {
    console.error('Error deleting shift:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// PATCH: Update shift status (clock in/out, confirm, etc.)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;
    const { action, clockTime } = await request.json();

    await dbConnect();

    const shift = await Shift.findById(id);
    if (!shift) {
      return new Response(JSON.stringify({ error: 'Shift not found' }), { status: 404 });
    }

    // Check permissions
    if (session.user.role !== 'admin' && 
        session.user.role !== 'restaurant_owner' && 
        shift.employeeId.toString() !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'confirm':
        if (session.user.role !== 'restaurant_owner' && session.user.role !== 'admin') {
          updateData.status = 'confirmed';
          message = 'Shift confirmed successfully';
        }
        break;

      case 'clock_in':
        if (!shift.clockInTime) {
          updateData.clockInTime = new Date();
          message = 'Clocked in successfully';
        }
        break;

      case 'clock_out':
        if (shift.clockInTime && !shift.clockOutTime) {
          updateData.clockOutTime = new Date();
          
          // Calculate actual hours
          const actualMinutes = (new Date() - shift.clockInTime) / (1000 * 60);
          updateData.actualHours = actualMinutes / 60;
          
          // Calculate overtime (if any)
          const scheduledHours = shift.totalHours || shift.calculatedHours;
          if (updateData.actualHours > scheduledHours) {
            updateData.overtimeHours = updateData.actualHours - scheduledHours;
          }
          
          message = 'Clocked out successfully';
        }
        break;

      case 'complete':
        if (session.user.role === 'restaurant_owner' || session.user.role === 'admin') {
          updateData.status = 'completed';
          message = 'Shift marked as completed';
        }
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: 'No update performed' }), { status: 400 });
    }

    updateData.lastModifiedBy = session.user.id;

    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('employeeId', 'firstName lastName email avatar role');

    return new Response(JSON.stringify({ 
      success: true,
      shift: updatedShift,
      message
    }), { status: 200 });

  } catch (error) {
    console.error('Error updating shift status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}