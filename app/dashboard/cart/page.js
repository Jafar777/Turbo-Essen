// app/dashboard/cart/page.js
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { showToast } from '@/lib/toast';

// Dynamically import the map component to avoid SSR issues
const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading map...</p>
      </div>
    </div>
  )
});

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [selectedOrderType, setSelectedOrderType] = useState('delivery');
  const [tableNumber, setTableNumber] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (session.user?.role !== 'user') {
      router.push('/dashboard');
      return;
    }

    fetchCart();
  }, [session, status, router]);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setCart({
          items: data.items || [],
          total: data.total || 0,
          itemCount: data.itemCount || 0
        });
      } else {
        console.error('Failed to fetch cart');
        setCart({
          items: [],
          total: 0,
          itemCount: 0
        });
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart({
        items: [],
        total: 0,
        itemCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          quantity: newQuantity
        }),
      });

      if (response.ok) {
        fetchCart();
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (itemId) => {
    setUpdating(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      });

      if (response.ok) {
        fetchCart();
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;
    
    setUpdating(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      if (response.ok) {
        setCart({ items: [], total: 0 });
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleLocationSelect = (location) => {
    setDeliveryLocation(location);
  };

  const placeOrder = async () => {
    if (!cart || cart.items.length === 0) return;
    
    // Validate dine-in order
    if (selectedOrderType === 'dine_in' && !tableNumber) {
    showToast.warning('Please enter a table number for dine-in orders');
      return;
    }

    if (selectedOrderType === 'dine_in' && (isNaN(tableNumber) || tableNumber < 1)) {
    showToast.warning('Please set your delivery location on the map');
      return;
    }

    // Validate delivery order
    if (selectedOrderType === 'delivery' && !deliveryLocation) {
      alert('Please set your delivery location on the map');
      return;
    }

    if (selectedOrderType === 'delivery' && (!deliveryLocation.address || !deliveryLocation.coordinates)) {
      alert('Please set a valid delivery location');
      return;
    }
    
    setIsPlacingOrder(true);
    try {
      const orderData = {
        paymentMethod: selectedPayment,
        items: cart.items,
        total: cart.total,
        orderType: selectedOrderType
      };

      // Add table number for dine-in orders
      if (selectedOrderType === 'dine_in') {
        orderData.tableNumber = parseInt(tableNumber);
      }

      // Add delivery location for delivery orders
      if (selectedOrderType === 'delivery' && deliveryLocation) {
        orderData.deliveryLocation = {
          address: deliveryLocation.address,
          coordinates: deliveryLocation.coordinates,
          apartment: deliveryLocation.apartment || '',
          floor: deliveryLocation.floor || '',
          instructions: deliveryLocation.instructions || ''
        };
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Clear the cart after successful order
        await fetch('/api/cart', { method: 'DELETE' });
        setCart({ items: [], total: 0 });
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Show success message
    showToast.success('Order placed successfully! You can track your order in the Orders section.');
        
        // Optionally redirect to orders page
        // router.push('/dashboard/orders');
      } else {
        const errorData = await response.json();
    showToast.error(errorData.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 mb-4">
                <div className="flex space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'user') {
    return null;
  }

  const cartItems = cart?.items || [];
  const cartTotal = cart?.total || 0;
  const itemCount = cart?.itemCount || cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            Review your items and proceed to checkout
          </p>
        </div>

        {cartItems.length === 0 ? (
          // Empty Cart State
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-8">
                Looks like you havent added any delicious items to your cart yet.
              </p>
              <Link
                href="/order-now"
                className="inline-flex items-center px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Browse Restaurants
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Cart Items ({itemCount})
                  </h2>
                  <button
                    onClick={clearCart}
                    disabled={updating}
                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                  >
                    Clear All
                  </button>
                </div>

                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item._id} className="p-6">
                      <div className="flex items-start space-x-4">
                        {item.dishImage && (
                          <img
                            src={item.dishImage}
                            alt={item.dishName}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.dishName}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {item.restaurantName}
                          </p>
                          <p className="text-amber-600 font-semibold text-lg mt-2">
                            ${item.price?.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              disabled={updating || item.quantity <= 1}
                              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="text-gray-600">-</span>
                            </button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              disabled={updating}
                              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                              <span className="text-gray-600">+</span>
                            </button>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item._id)}
                            disabled={updating}
                            className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                    <span className="font-medium">${cartTotal?.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-amber-600">
                        ${cartTotal?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Type Selection */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Order Type
                  </h3>
                  <div className="space-y-2">
                    {/* Delivery */}
                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="orderType"
                          value="delivery"
                          checked={selectedOrderType === 'delivery'}
                          onChange={(e) => setSelectedOrderType(e.target.value)}
                          className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-700 font-medium">🚚 Delivery</span>
                        <p className="text-sm text-gray-500">Get your food delivered to your location</p>
                      </div>
                    </label>

                    {/* Dine In */}
                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="orderType"
                          value="dine_in"
                          checked={selectedOrderType === 'dine_in'}
                          onChange={(e) => setSelectedOrderType(e.target.value)}
                          className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-700 font-medium">🍽️ Dine In</span>
                        <p className="text-sm text-gray-500">Eat at the restaurant</p>
                      </div>
                    </label>

                    {/* Takeaway */}
                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="orderType"
                          value="takeaway"
                          checked={selectedOrderType === 'takeaway'}
                          onChange={(e) => setSelectedOrderType(e.target.value)}
                          className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-700 font-medium">📦 Takeaway</span>
                        <p className="text-sm text-gray-500">Pick up your order to go</p>
                      </div>
                    </label>
                  </div>

                  {/* Table Number Input for Dine In */}
                  {selectedOrderType === 'dine_in' && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Table Number *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Enter your table number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        Please enter the table number where you are seated
                      </p>
                    </div>
                  )}

                  {/* Delivery Location Map for Delivery */}
                  {selectedOrderType === 'delivery' && (
                    <div className="mt-4">
                      <DeliveryMap onLocationSelect={handleLocationSelect} />
                    </div>
                  )}
                </div>

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Payment Method
                  </h3>
                  <div className="space-y-2">
                    {/* Cash on Delivery */}
                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="payment"
                          value="cash"
                          checked={selectedPayment === 'cash'}
                          onChange={(e) => setSelectedPayment(e.target.value)}
                          className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-700 font-medium">Cash on {selectedOrderType === 'delivery' ? 'Delivery' : selectedOrderType === 'dine_in' ? 'Arrival' : 'Pickup'}</span>
                        <p className="text-sm text-gray-500">
                          {selectedOrderType === 'delivery' 
                            ? 'Pay when you receive your order' 
                            : selectedOrderType === 'dine_in'
                            ? 'Pay at the restaurant'
                            : 'Pay when you pick up your order'}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                    </label>

                    {/* Stripe (Disabled) */}
                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-not-allowed opacity-50">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="payment"
                          value="stripe"
                          disabled
                          className="h-4 w-4 text-gray-300 border-gray-300"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-500 font-medium">Credit/Debit Card</span>
                        <p className="text-sm text-gray-400">Pay securely with Stripe</p>
                      </div>
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">🔒</span>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={isPlacingOrder || updating || 
                    (selectedOrderType === 'dine_in' && !tableNumber) ||
                    (selectedOrderType === 'delivery' && !deliveryLocation)}
                  className="w-full bg-amber-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-600 transition-colors duration-200 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlacingOrder 
                    ? 'Placing Order...' 
                    : selectedOrderType === 'delivery'
                    ? 'Place Delivery Order'
                    : selectedOrderType === 'dine_in'
                    ? 'Place Dine-in Order'
                    : 'Place Takeaway Order'}
                </button>

                <Link
                  href="/order-now"
                  className="block text-center text-amber-600 hover:text-amber-700 font-medium"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}