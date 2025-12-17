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
  const [availableTables, setAvailableTables] = useState([]);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [restaurantOrderTypes, setRestaurantOrderTypes] = useState(['dine_in', 'delivery', 'takeaway']);
  const [tipAmount, setTipAmount] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Set default order type based on available options
  useEffect(() => {
    if (restaurantOrderTypes.length > 0 && !restaurantOrderTypes.includes(selectedOrderType)) {
      setSelectedOrderType(restaurantOrderTypes[0]);
    }
  }, [restaurantOrderTypes, selectedOrderType]);

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
        const cartData = {
          items: data.items || [],
          total: data.total || 0,
          itemCount: data.itemCount || 0
        };
        setCart(cartData);

        // Fetch restaurant order types and available tables
        if (data.items && data.items.length > 0) {
          const restaurantId = data.items[0].restaurantId;

          // Fetch restaurant details including orderTypes
          const restaurantResponse = await fetch(`/api/restaurants/${restaurantId}`);
          if (restaurantResponse.ok) {
            const restaurantData = await restaurantResponse.json();
            const enabledOrderTypes = restaurantData.restaurant.orderTypes || ['dine_in', 'delivery', 'takeaway'];
            setRestaurantOrderTypes(enabledOrderTypes);
            
            // Update selected order type if current one is not available
            if (!enabledOrderTypes.includes(selectedOrderType) && enabledOrderTypes.length > 0) {
              setSelectedOrderType(enabledOrderTypes[0]);
            }
          }

          // Fetch available tables
          const tablesResponse = await fetch(`/api/restaurants/available-tables?restaurantId=${restaurantId}`);
          if (tablesResponse.ok) {
            const tablesData = await tablesResponse.json();
            setAvailableTables(tablesData.tables || []);
          }
        } else {
          setRestaurantOrderTypes(['dine_in', 'delivery', 'takeaway']);
          setAvailableTables([]);
        }
      } else {
        console.error('Failed to fetch cart');
        setCart({
          items: [],
          total: 0,
          itemCount: 0
        });
        setRestaurantOrderTypes(['dine_in', 'delivery', 'takeaway']);
        setAvailableTables([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart({
        items: [],
        total: 0,
        itemCount: 0
      });
      setRestaurantOrderTypes(['dine_in', 'delivery', 'takeaway']);
      setAvailableTables([]);
    } finally {
      setLoading(false);
    }
  };

  // In your cart page component, replace the fetchAvailableTables function:
  const fetchAvailableTables = async () => {
    try {
      if (cart && cart.items && cart.items.length > 0) {
        const restaurantId = cart.items[0].restaurantId;
        // Use the new endpoint
        const response = await fetch(`/api/restaurants/available-tables?restaurantId=${restaurantId}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableTables(data.tables || []);
        }
      } else {
        setAvailableTables([]);
      }
    } catch (error) {
      console.error('Error fetching available tables:', error);
      setAvailableTables([]);
    }
  };

  // Add another useEffect to fetch tables when cart is updated
  useEffect(() => {
    if (cart && cart.items && cart.items.length > 0) {
      fetchAvailableTables();
    } else {
      setAvailableTables([]);
    }
  }, [cart]);

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
    if (selectedOrderType === 'dine_in') {
      if (!tableNumber) {
        showToast.warning('Please select a table number for dine-in orders');
        return;
      }

      // Check if selected table is available
      const selectedTable = availableTables.find(t => t.tableNumber === parseInt(tableNumber));
      if (!selectedTable || selectedTable.status !== 'available') {
        showToast.warning('Selected table is not available. Please choose another table.');
        return;
      }
    }

    // Validate delivery order
    if (selectedOrderType === 'delivery' && !deliveryLocation) {
      showToast.warning('Please set your delivery location on the map');
      return;
    }

    if (selectedOrderType === 'delivery' && (!deliveryLocation.address || !deliveryLocation.coordinates)) {
      showToast.warning('Please set a valid delivery location');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        paymentMethod: selectedPayment,
        items: cart.items,
        total: cart.total,
        tipAmount: selectedOrderType === 'delivery' ? tipAmount : 0,
        finalTotal: cart.total + (selectedOrderType === 'delivery' ? tipAmount : 0),
        specialInstructions: specialInstructions,
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

        showToast.success('Order placed successfully! You can track your order in the Orders section.');

        // Redirect to orders page
        router.push('/dashboard/orders');
      } else {
        const errorData = await response.json();
        showToast.error(errorData.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showToast.error('Error placing order. Please try again.');
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

  // Calculate final total including tip for delivery orders
  const finalTotal = selectedOrderType === 'delivery' ? cartTotal + tipAmount : cartTotal;

  // Filter available tables for dine-in
  const availableTableNumbers = availableTables
    .filter(table => table.status === 'available')
    .map(table => table.tableNumber)
    .sort((a, b) => a - b);

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
                Looks like you haven't added any delicious items to your cart yet.
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
                  
                  {/* Show tip amount for delivery orders */}
                  {selectedOrderType === 'delivery' && tipAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Tip</span>
                      <span className="font-medium text-green-600">+${tipAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Final Total</span>
                      <span className="text-amber-600">
                        ${finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Special Instructions (Optional)
                  </h3>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requests for your order?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                    rows={3}
                  />
                </div>

                {/* Order Type Selection */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Order Type
                  </h3>
                  <div className="space-y-2">
                    {/* Delivery - Only show if enabled */}
                    {restaurantOrderTypes.includes('delivery') && (
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
                    )}

                    {/* Dine In - Only show if enabled */}
                    {restaurantOrderTypes.includes('dine_in') && (
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
                    )}

                    {/* Takeaway - Only show if enabled */}
                    {restaurantOrderTypes.includes('takeaway') && (
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
                    )}

                    {/* Message when no order types are available */}
                    {restaurantOrderTypes.length === 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm font-medium">
                          This restaurant is not currently accepting any orders. Please check back later.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Table Number Selection for Dine In - Only show if dine_in is selected AND enabled */}
                  {selectedOrderType === 'dine_in' && restaurantOrderTypes.includes('dine_in') && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Table Number *
                      </label>
                      {loading ? (
                        <div className="w-full px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
                          Loading tables...
                        </div>
                      ) : (
                        <>
                          <select
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select a table</option>
                            {availableTableNumbers.map(tableNum => (
                              <option key={tableNum} value={tableNum}>
                                Table {tableNum}
                              </option>
                            ))}
                          </select>
                          {availableTableNumbers.length === 0 ? (
                            <p className="text-xs text-red-600 mt-1">
                              No tables available. Please choose another order type.
                            </p>
                          ) : (
                            <p className="text-xs text-blue-600 mt-1">
                              Please select the table where you are seated
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Delivery Location Map for Delivery - Only show if delivery is selected AND enabled */}
                  {selectedOrderType === 'delivery' && restaurantOrderTypes.includes('delivery') && (
                    <div className="mt-4">
                      <DeliveryMap onLocationSelect={handleLocationSelect} />
                    </div>
                  )}
                </div>

                {/* Tip Selection (Only for Delivery) */}
                {selectedOrderType === 'delivery' && restaurantOrderTypes.includes('delivery') && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      💝 Tip Your Delivery Person (Optional)
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="tip"
                          checked={tipAmount === 0}
                          onChange={() => setTipAmount(0)}
                          className="h-4 w-4 text-amber-500"
                        />
                        <span className="text-gray-700">No tip</span>
                      </label>
                      {[2, 5, 10].map((tip) => (
                        <label key={tip} className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="tip"
                            checked={tipAmount === tip}
                            onChange={() => setTipAmount(tip)}
                            className="h-4 w-4 text-amber-500"
                          />
                          <span className="text-gray-700">${tip} tip</span>
                          <span className="text-sm text-gray-500 ml-auto">
                            (Total: ${(cartTotal + tip).toFixed(2)})
                          </span>
                        </label>
                      ))}
                      <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="tip"
                          checked={tipAmount !== 0 && ![2, 5, 10].includes(tipAmount)}
                          onChange={() => {
                            const customTip = parseFloat(prompt('Enter custom tip amount ($):', '5')) || 0;
                            setTipAmount(Math.max(0, customTip));
                          }}
                          className="h-4 w-4 text-amber-500"
                        />
                        <span className="text-gray-700">Custom tip amount</span>
                        {tipAmount > 0 && ![2, 5, 10].includes(tipAmount) && (
                          <span className="text-sm text-amber-600 ml-auto">
                            ${tipAmount.toFixed(2)} selected
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                )}

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
                    (selectedOrderType === 'delivery' && !deliveryLocation) ||
                    restaurantOrderTypes.length === 0}
                  className="w-full bg-amber-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-600 transition-colors duration-200 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlacingOrder
                    ? 'Placing Order...'
                    : selectedOrderType === 'delivery'
                      ? `Place Order ($${finalTotal.toFixed(2)})`
                      : selectedOrderType === 'dine_in'
                        ? `Place Dine-in Order ($${finalTotal.toFixed(2)})`
                        : `Place Takeaway Order ($${finalTotal.toFixed(2)})`}
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