// app/api/job-offers/sent/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import JobOffer from '@/models/JobOffer';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'restaurant_owner') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await dbConnect();

    const offers = await JobOffer.find({ restaurantOwnerId: session.user.id })
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 });
    
    return new Response(JSON.stringify({ offers }), { status: 200 });

  } catch (error) {
    console.error('Error fetching sent job offers:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}