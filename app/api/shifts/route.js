// app/api/shifts/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Shift from '@/models/Shift';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';

// GET: Fetch shifts with filters
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    // Verify restaurant access
    if (session.user.role === 'restaurant_owner') {
      const restaurant = await Restaurant.findOne({ ownerId: session.user.id });
      if (!restaurant) {
        return new Response(JSON.stringify({ error: 'Restaurant not found' }), { status: 404 });
      }
      if (restaurantId && restaurantId !== restaurant._id.toString()) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
      }
    } else if (session.user.role === 'admin') {
      // Admin can access all
    } else {
      // Employee can only see their own shifts
      const query = { employeeId: session.user.id };
      
      if (restaurantId) {
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
          return new Response(JSON.stringify({ error: 'Restaurant not found' }), { status: 404 });
        }
        query.restaurantId = restaurantId;
      }
      
      if (startDate && endDate) {
        query.shiftDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      if (status) {
        query.status = status;
      }

      const shifts = await Shift.find(query)
        .populate('employeeId', 'firstName lastName email avatar')
        .sort({ shiftDate: 1, startTime: 1 });

      return new Response(JSON.stringify({ 
        success: true,
        shifts 
      }), { status: 200 });
    }

    // For restaurant owner/admin: build query
    const query = {};
    
    if (restaurantId) {
      query.restaurantId = restaurantId;
    } else if (session.user.role === 'restaurant_owner') {
      const restaurant = await Restaurant.findOne({ ownerId: session.user.id });
      query.restaurantId = restaurant._id;
    }
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    if (startDate && endDate) {
      query.shiftDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }

    const shifts = await Shift.find(query)
      .populate('employeeId', 'firstName lastName email avatar role')
      .populate('createdBy', 'firstName lastName')
      .sort({ shiftDate: 1, startTime: 1 });

    return new Response(JSON.stringify({ 
      success: true,
      shifts 
    }), { status: 200 });

  } catch (error) {
    console.error('Error fetching shifts:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// POST: Create new shift
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['restaurant_owner', 'admin'].includes(session.user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await dbConnect();

    const data = await request.json();
    
    // Verify restaurant ownership
    const restaurant = await Restaurant.findOne({ 
      _id: data.restaurantId,
      ownerId: session.user.role === 'restaurant_owner' ? session.user.id : { $exists: true }
    });
    
    if (!restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found or unauthorized' }), { status: 404 });
    }

    // Check for scheduling conflicts
    const hasConflict = await Shift.checkConflict(
      data.employeeId,
      new Date(data.shiftDate),
      data.startTime,
      data.endTime
    );
    
    if (hasConflict) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Scheduling conflict: Employee already has a shift during this time'
      }), { status: 400 });
    }

    // Get employee details
    const employee = await User.findById(data.employeeId);
    if (!employee) {
      return new Response(JSON.stringify({ error: 'Employee not found' }), { status: 404 });
    }

    const shiftData = {
      ...data,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      createdBy: session.user.id,
      lastModifiedBy: session.user.id
    };

    const shift = await Shift.create(shiftData);

    // Send notification to employee
    if (employee.email) {
      await sendEmail({
        to: employee.email,
        subject: `New Shift Scheduled - ${restaurant.name}`,
        template: 'shift-scheduled',
        data: {
          employeeName: employee.firstName,
          restaurantName: restaurant.name,
          shiftDate: new Date(data.shiftDate).toLocaleDateString(),
          shiftTime: `${data.startTime} - ${data.endTime}`,
          role: data.role,
          notes: data.notes || 'No additional notes'
        }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      shift,
      message: 'Shift created successfully'
    }), { status: 201 });

  } catch (error) {
    console.error('Error creating shift:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}