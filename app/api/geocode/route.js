// app/api/geocode/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: 'Geocoding failed: ' + data.status }, { status: 400 });
    }
  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}