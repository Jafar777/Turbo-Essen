// /app/api/cloudinary/delete/route.js
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Generate SHA1 hash for signature
const generateSHA1 = (data) => {
  const hash = crypto.createHash('sha1');
  hash.update(data);
  return hash.digest('hex');
};

// Generate signature for Cloudinary
const generateSignature = (publicId, apiSecret) => {
  const timestamp = new Date().getTime();
  return `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
};

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicId } = await request.json();
    
    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const timestamp = new Date().getTime();
    const signature = generateSHA1(generateSignature(publicId, apiSecret));
    
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;

    // Delete from Cloudinary
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('signature', signature);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);

    const cloudinaryResponse = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const result = await cloudinaryResponse.json();

    if (result.result !== 'ok') {
      console.error('Cloudinary deletion failed:', result);
      return NextResponse.json({ error: 'Failed to delete image from Cloudinary' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Image deleted successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}