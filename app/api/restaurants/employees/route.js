// app/api/restaurants/employees/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';

// GET: Fetch all employees for the restaurant
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'restaurant_owner') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await dbConnect();

    // Find the restaurant owned by this user
    const restaurant = await Restaurant.findOne({ ownerId: session.user.id });
    
    if (!restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found' }), { status: 404 });
    }

    // Find all employees (chef, waiter, delivery) for this restaurant
    const employees = await User.find({
      restaurantId: restaurant._id,
      role: { $in: ['chef', 'waiter', 'delivery'] }
    }).select('-password');

    return new Response(JSON.stringify({ 
      success: true,
      employees 
    }), { status: 200 });

  } catch (error) {
    console.error('Error fetching employees:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// PUT: Update employee role
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'restaurant_owner') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { employeeId, newRole } = await request.json();

    if (!employeeId || !newRole) {
      return new Response(JSON.stringify({ error: 'Employee ID and new role are required' }), { status: 400 });
    }

    if (!['chef', 'waiter', 'delivery', 'user'].includes(newRole)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400 });
    }

    await dbConnect();

    // Find the restaurant owned by this user
    const restaurant = await Restaurant.findOne({ ownerId: session.user.id });
    
    if (!restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found' }), { status: 404 });
    }

    // Find the employee and verify they belong to this restaurant
    const employee = await User.findOne({
      _id: employeeId,
      restaurantId: restaurant._id,
      role: { $in: ['chef', 'waiter', 'delivery'] }
    });

    if (!employee) {
      return new Response(JSON.stringify({ error: 'Employee not found or access denied' }), { status: 404 });
    }

    // Update employee role
    // If role is set to 'user', remove restaurantId and set role to 'user'
    if (newRole === 'user') {
      employee.role = 'user';
      employee.restaurantId = undefined;
    } else {
      employee.role = newRole;
      // Keep the same restaurantId for role changes between chef/waiter/delivery
    }

    await employee.save();

    return new Response(JSON.stringify({ 
      success: true,
      message: `Employee role updated successfully`,
      employee: {
        _id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        role: employee.role
      }
    }), { status: 200 });

  } catch (error) {
    console.error('Error updating employee:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}