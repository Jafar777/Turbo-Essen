// /app/api/sign-cloudinary-params/route.js
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request) {
  try {
    const body = await request.json();
    const { paramsToSign } = body;

    if (!paramsToSign) {
      return new Response(JSON.stringify({ error: 'Missing paramsToSign in request body.' }), {
        status: 400,
      });
    }

    // Generate the signature using your API secret from the environment variables
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return new Response(JSON.stringify({ signature }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}