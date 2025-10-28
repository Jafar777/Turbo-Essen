// app/dashboard/reviews/page.js
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaStar, FaRegStar, FaUserCircle } from "react-icons/fa";
import { showToast } from '@/lib/toast';

export default function ReviewsPage() {
  const [reviewableOrders, setReviewableOrders] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [restaurantReviews, setRestaurantReviews] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'my-reviews' for users, 'all-reviews' for owners
  const { data: session, status } = useSession();
  const router = useRouter();

  const isUser = session?.user?.role === 'user';
  const isRestaurantOwner = session?.user?.role === 'restaurant_owner';

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!isUser && !isRestaurantOwner) {
      router.push('/dashboard');
      return;
    }

    if (isUser) {
      fetchReviewableOrders();
      fetchUserReviews();
    } else if (isRestaurantOwner) {
      fetchRestaurantAndReviews();
    }
  }, [session, status, router, isUser, isRestaurantOwner]);

  // User functions
  const fetchReviewableOrders = async () => {
    try {
      const response = await fetch('/api/reviews/reviewable-orders');
      if (response.ok) {
        const data = await response.json();
        setReviewableOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching reviewable orders:', error);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Restaurant owner functions
  const fetchRestaurantAndReviews = async () => {
    try {
      // First, get the restaurant owned by this user
      const restaurantResponse = await fetch('/api/restaurants/my-restaurant');
      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json();
        if (restaurantData.restaurant) {
          setRestaurant(restaurantData.restaurant);
          // Then fetch reviews for this restaurant
          await fetchRestaurantReviews(restaurantData.restaurant._id);
        } else {
          setLoading(false);
        }
      } else {
        console.error('Failed to fetch restaurant');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const fetchRestaurantReviews = async (restaurantId) => {
    try {
      const response = await fetch(`/api/reviews?restaurantId=${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        setRestaurantReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching restaurant reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (orderId, restaurantId, rating, comment) => {
    setSubmitting(orderId);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          restaurantId,
          rating,
          comment
        }),
      });

      if (response.ok) {
        // Refresh both lists
        fetchReviewableOrders();
        fetchUserReviews();
    showToast.success('Review submitted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    showToast.error(errorData.error || 'Failed to submit review');
    } finally {
      setSubmitting(null);
    }
  };

  const StarRating = ({ rating, setRating, disabled = false }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !disabled && setRating(star)}
            disabled={disabled}
            className={`${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            {star <= rating ? (
              <FaStar className="w-6 h-6 text-amber-500" />
            ) : (
              <FaRegStar className="w-6 h-6 text-amber-500" />
            )}
          </button>
        ))}
      </div>
    );
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

  if (!session || (!isUser && !isRestaurantOwner)) {
    return null;
  }

  // Restaurant Owner View
  if (isRestaurantOwner) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
            <p className="text-gray-600 mt-2">
              See what customers are saying about {restaurant?.name || 'your restaurant'}
            </p>
            
            {/* Restaurant Rating Summary */}
            {restaurant && (
              <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">
                        {restaurant.averageRating?.toFixed(1) || '0.0'}
                      </div>
                      <StarRating rating={Math.round(restaurant.averageRating) || 0} disabled={true} />
                      <div className="text-sm text-gray-600 mt-2">
                        {restaurant.totalReviews || 0} reviews
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = restaurant.ratingCount?.[star] || 0;
                        const total = restaurant.totalReviews || 1;
                        const percentage = (count / total) * 100;
                        
                        return (
                          <div key={star} className="flex items-center space-x-3 mb-2">
                            <span className="text-sm font-medium text-gray-600 w-8">
                              {star}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-amber-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                All Reviews ({restaurantReviews.length})
              </h2>
            </div>

            <div className="p-6">
              {restaurantReviews.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaRegStar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No reviews yet
                  </h3>
                  <p className="text-gray-600">
                    Customer reviews will appear here once they start reviewing your restaurant.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {restaurantReviews.map((review) => (
                    <div key={review._id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {review.userId?.image ? (
                            <img
                              src={review.userId.image}
                              alt={review.userId.firstName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <FaUserCircle className="w-10 h-10 text-gray-400" />
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {review.userId?.firstName} {review.userId?.lastName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} disabled={true} />
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 bg-gray-50 rounded-lg p-4">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User View (original code)
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="text-gray-600 mt-2">
            Share your experience and read what others think
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('write')}
              className={`flex-1 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'write'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Write a Review
            </button>
            <button
              onClick={() => setActiveTab('my-reviews')}
              className={`flex-1 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'my-reviews'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Reviews ({userReviews.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'write' ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Review Your Delivered Orders
                </h2>
                
                {reviewableOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaRegStar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No orders to review yet
                    </h3>
                    <p className="text-gray-600">
                      Youll be able to review orders once theyre delivered.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviewableOrders.map((order) => (
                      <ReviewForm
                        key={order._id}
                        order={order}
                        onSubmit={submitReview}
                        submitting={submitting === order._id}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  My Reviews
                </h2>
                
                {userReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaRegStar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No reviews yet
                    </h3>
                    <p className="text-gray-600">
                      You havent written any reviews yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userReviews.map((review) => (
                      <div key={review._id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {review.restaurantId?.name || 'Restaurant'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StarRating rating={review.rating} disabled={true} />
                        </div>
                        {review.comment && (
                          <p className="text-gray-700">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Review Form Component (unchanged)
function ReviewForm({ order, onSubmit, submitting }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    onSubmit(order._id, order.restaurantId._id, rating, comment);
    setRating(0);
    setComment('');
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-start space-x-4 mb-4">
        {order.restaurantId.avatar ? (
          <img
            src={order.restaurantId.avatar}
            alt={order.restaurantId.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {order.restaurantId.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{order.restaurantId.name}</h3>
          <p className="text-sm text-gray-600">
            Order #{order._id.slice(-8).toUpperCase()} • Delivered on {new Date(order.updatedAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            Total: ${order.total.toFixed(2)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate your experience?
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="cursor-pointer hover:scale-110 transition-transform"
              >
                {star <= rating ? (
                  <FaStar className="w-8 h-8 text-amber-500" />
                ) : (
                  <FaRegStar className="w-8 h-8 text-amber-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor={`comment-${order._id}`} className="block text-sm font-medium text-gray-700 mb-2">
            Share your experience (optional)
          </label>
          <textarea
            id={`comment-${order._id}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="What did you like about the food and service?"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/500 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}