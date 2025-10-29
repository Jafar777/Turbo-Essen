// app/dashboard/restaurant-qr/page.js
'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/lib/toast';
import QRCode from 'qrcode';
import { IoQrCode } from 'react-icons/io5';

export default function RestaurantQRPage() {
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [generating, setGenerating] = useState(false);
    const { data: session, status } = useSession();
    const router = useRouter();
    const canvasRef = useRef(null);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session || session.user?.role !== 'restaurant_owner') {
            router.push('/dashboard');
            return;
        }

        fetchRestaurant();
    }, [session, status, router]);

// In the fetchRestaurant function, change the URL:
const fetchRestaurant = async () => {
  try {
    const response = await fetch('/api/restaurants/owner'); // Changed from '/api/restaurants/owner'
    if (response.ok) {
      const data = await response.json();
      setRestaurant(data.restaurant);
    } else {
      showToast.error('Failed to fetch restaurant data');
    }
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    showToast.error('Error fetching restaurant data');
  } finally {
    setLoading(false);
  }
};

    const generateQRCode = async () => {
        if (!restaurant) return;

        setGenerating(true);
        try {
            const restaurantUrl = `${window.location.origin}/restaurants/${restaurant.slug}`;

            // Generate QR code as data URL
            const url = await QRCode.toDataURL(restaurantUrl, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#ce5a46',
                    light: '#FFFFFF'
                }
            });

            setQrCodeUrl(url);

            // Also generate for canvas (for download)
            if (canvasRef.current) {
                await QRCode.toCanvas(canvasRef.current, restaurantUrl, {
                    width: 400,
                    margin: 2,
                    color: {
                        dark: '#ce5a46',
                        light: '#FFFFFF'
                    }
                });
            }

            showToast.success('QR Code generated successfully!');
        } catch (error) {
            console.error('Error generating QR code:', error);
            showToast.error('Failed to generate QR code');
        } finally {
            setGenerating(false);
        }
    };

    const downloadQRCode = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const link = document.createElement('a');
        link.download = `turboessen-${restaurant.slug}-qrcode.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const printQRCode = () => {
        if (!qrCodeUrl) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <html>
        <head>
          <title>${restaurant.name} - QR Code</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px;
              background: white;
            }
            .restaurant-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 20px;
              color: #374151;
            }
            .instructions {
              margin-top: 20px;
              color: #6b7280;
              font-size: 14px;
            }
            .url {
              margin: 10px 0;
              color: #ce5a46;
              font-weight: bold;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="restaurant-name">${restaurant.name}</div>
          <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 300px;" />
          <div class="url">${window.location.origin}/restaurants/${restaurant.slug}</div>
          <div class="instructions">Scan this QR code to visit our restaurant page on TurboEssen</div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                        <div className="bg-white rounded-lg shadow-sm p-8">
                            <div className="h-64 bg-gray-200 rounded mb-6"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!session || session.user?.role !== 'restaurant_owner') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Restaurant QR Code</h1>
                    <p className="text-gray-600 mt-2">
                        Generate and download a QR code for your restaurant page
                    </p>
                </div>

                {!restaurant ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Restaurant Found</h2>
                            <p className="text-gray-600 mb-8">
                                You need to set up your restaurant first to generate a QR code.
                            </p>
                            <button
                                onClick={() => router.push('/dashboard/restaurant')}
                                className="inline-flex items-center px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors duration-200"
                            >
                                Set Up Restaurant
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {/* Restaurant Info */}
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">{restaurant.name}</h2>
                            <p className="text-gray-600">
                                Your restaurant URL: <span className="text-amber-600 font-medium">{window.location.origin}/restaurants/{restaurant.slug}</span>
                            </p>
                        </div>

                        {/* QR Code Generation */}
                        <div className="p-8">
                            <div className="text-center">
                                {!qrCodeUrl ? (
                                    <div className="py-12">
                                        <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Your QR Code</h3>
                                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                            Create a QR code that customers can scan to directly access your restaurant page on TurboEssen.
                                        </p>
                                        <button
                                            onClick={generateQRCode}
                                            disabled={generating}
                                            className="inline-flex items-center px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors duration-200 disabled:opacity-50"
                                        >
                                            {generating ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <IoQrCode className="w-5 h-5 mr-2" />
                                                    Generate QR Code
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* QR Code Display */}
                                        <div className="flex flex-col items-center">
                                            <div className="bg-white p-6 rounded-lg border-2 border-amber-200 inline-block">
                                                <img
                                                    src={qrCodeUrl}
                                                    alt="QR Code"
                                                    className="w-64 h-64"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500 mt-4 max-w-md">
                                                Scan this QR code with your phones camera to visit <strong>{restaurant.name}</strong> on TurboEssen
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                            <button
                                                onClick={downloadQRCode}
                                                className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download PNG
                                            </button>

                                            <button
                                                onClick={printQRCode}
                                                className="inline-flex items-center px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors duration-200"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                                Print
                                            </button>

                                            <button
                                                onClick={generateQRCode}
                                                className="inline-flex items-center px-6 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors duration-200"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Regenerate
                                            </button>
                                        </div>

                                        {/* Usage Tips */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                                            <h4 className="font-semibold text-amber-800 mb-2">💡 Usage Tips</h4>
                                            <ul className="text-sm text-amber-700 space-y-1">
                                                <li>• Print and display at your restaurant entrance</li>
                                                <li>• Include on your menu or table tents</li>
                                                <li>• Share digitally on social media</li>
                                                <li>• Add to your email signature</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Hidden canvas for download */}
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}