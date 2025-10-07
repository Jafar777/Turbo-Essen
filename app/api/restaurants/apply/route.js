// app/api/restaurants/apply/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Application from '@/models/Application';
import { notifyNewApplication } from '@/lib/notificationUtils'; // Import the function

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'You must be logged in to apply' }),
        { status: 401 }
      );
    }

    const applicationData = await request.json();
    await dbConnect();

    const newApplication = new Application({
      userId: session.user.id,
      restaurantName: applicationData.restaurantName,
      address: applicationData.address,
      phone: applicationData.phone,
      cuisineType: applicationData.cuisineType,
      description: applicationData.description,
      location: {
        type: 'Point',
        coordinates: [
          applicationData.coordinates.lng, 
          applicationData.coordinates.lat
        ]
      },
      status: 'pending',
      appliedAt: new Date()
    });

    const savedApplication = await newApplication.save();
    
    // === ADD THIS CALL TO NOTIFY ADMINS ===
    await notifyNewApplication(savedApplication);
    
    return new Response(
      JSON.stringify({ 
        message: 'Application submitted successfully!',
        applicationId: savedApplication._id 
      }),
      { status: 201 }
    );

  } catch (error) {
    console.error('Application submission error:', error);
    
    if (error.code === 11000) {
      return new Response(
        JSON.stringify({ error: 'You have already applied with this restaurant' }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}