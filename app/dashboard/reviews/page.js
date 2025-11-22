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
  const [activeTab, setActiveTab] = useState('write');
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

  const fetchRestaurantAndReviews = async () => {
    try {
      const restaurantResponse = await fetch('/api/restaurants/my-restaurant');
      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json();
        if (restaurantData.restaurant) {
          setRestaurant(restaurantData.restaurant);
          await fetchRestaurantReviews(restaurantData.restaurant._id);
        } else {
          setLoading(false);
        }
      } else {
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
        fetchReviewableOrders();
        fetchUserReviews();
        showToast.success('Review submitted successfully!');
      } else {
        const errorData = await response.json();
        showToast.error(errorData.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast.error('Failed to submit review');
    } finally {
      setSubmitting(null);
    }
  };

  const StarRating = ({ rating, setRating, disabled = false, size = 'md' }) => {
    const starSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
    
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
              <FaStar className={`${starSize} text-amber-500`} />
            ) : (
              <FaRegStar className={`${starSize} text-amber-500`} />
            )}
          </button>
        ))}
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 md:py-8">
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
      <div className="min-h-screen bg-gray-50 py-6 md:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customer Reviews</h1>
            <p className="text-gray-600 mt-1 md:mt-2">
              Customer feedback for {restaurant?.name || 'your restaurant'}
            </p>
          </div>

          {/* Rating Summary */}
          {restaurant && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-8 space-y-4 md:space-y-0">
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                      {restaurant.averageRating?.toFixed(1) || '0.0'}
                    </div>
                    <div className="flex justify-center">
                      <StarRating rating={Math.round(restaurant.averageRating) || 0} disabled={true} />
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {restaurant.totalReviews || 0} total reviews
                    </div>
                  </div>
                  
                  <div className="flex-1 md:min-w-[200px]">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = restaurant.ratingCount?.[star] || 0;
                      const total = restaurant.totalReviews || 1;
                      const percentage = (count / total) * 100;
                      
                      return (
                        <div key={star} className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-600 w-4">
                            {star}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-amber-500 h-2.5 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">
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

          {/* Reviews List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                All Reviews ({restaurantReviews.length})
              </h2>
            </div>

            <div className="p-4 md:p-6">
              {restaurantReviews.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaRegStar className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No reviews yet
                  </h3>
                  <p className="text-gray-600">
                    Customer reviews will appear here once they start reviewing.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {restaurantReviews.map((review) => (
                    <div key={review._id} className="border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3 md:mb-4">
                        <div className="flex items-center space-x-3 md:space-x-4 mb-3 md:mb-0">
                          {review.userId?.image ? (
                            <img
                              src={review.userId.image}
                              alt={review.userId.firstName}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                            />
                          ) : (
                            <FaUserCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 md:text-lg">
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
                        <p className="text-gray-700 bg-gray-50 rounded-lg p-3 md:p-4 text-sm leading-relaxed mt-3">
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

  // User View
  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-600 mt-1 md:mt-2">
            Share your experience with restaurants
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('write')}
              className={`flex-1 px-4 md:px-6 py-3 md:py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'write'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Write Review
            </button>
            <button
              onClick={() => setActiveTab('my-reviews')}
              className={`flex-1 px-4 md:px-6 py-3 md:py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'my-reviews'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Reviews ({userReviews.length})
            </button>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === 'write' ? (
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
                  Review Your Orders
                </h2>
                
                {reviewableOrders.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaRegStar className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No orders to review
                    </h3>
                    <p className="text-gray-600">
                      You can review orders once they are delivered.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
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
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
                  My Reviews
                </h2>
                
                {userReviews.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaRegStar className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No reviews yet
                    </h3>
                    <p className="text-gray-600">
                      You haven't written any reviews yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    {userReviews.map((review) => (
                      <div key={review._id} className="border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-sm transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3 md:mb-4">
                          <div className="flex-1 mb-2 md:mb-0">
                            <h3 className="font-semibold text-gray-900 md:text-lg">
                              {review.restaurantId?.name || 'Restaurant'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <StarRating rating={review.rating} disabled={true} />
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 text-sm leading-relaxed mt-3">{review.comment}</p>
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

// Review Form Component
function ReviewForm({ order, onSubmit, submitting }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      showToast.error('Please select a rating');
      return;
    }
    onSubmit(order._id, order.restaurantId._id, rating, comment);
    setRating(0);
    setComment('');
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-sm transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start md:space-x-4 mb-4 md:mb-6">
        {order.restaurantId.avatar ? (
          <img
            src={order.restaurantId.avatar}
            alt={order.restaurantId.name}
            className="w-16 h-16 rounded-xl object-cover mx-auto md:mx-0 mb-3 md:mb-0"
          />
        ) : (
          <div className="w-16 h-16 bg-amber-500 rounded-xl flex items-center justify-center mx-auto md:mx-0 mb-3 md:mb-0">
            <span className="text-white font-bold text-lg">
              {order.restaurantId.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-semibold text-gray-900 text-lg">{order.restaurantId.name}</h3>
          <p className="text-sm text-gray-600 mb-1">
            Order #{order._id.slice(-8).toUpperCase()}
          </p>
          <p className="text-sm text-gray-600">
            Delivered on {new Date(order.updatedAt).toLocaleDateString()} • ${order.total.toFixed(2)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 md:mb-3">
            Rate your experience
          </label>
          <div className="flex justify-center md:justify-start space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="cursor-pointer hover:scale-110 transition-transform"
              >
                {star <= rating ? (
                  <FaStar className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />
                ) : (
                  <FaRegStar className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor={`comment-${order._id}`} className="block text-sm font-medium text-gray-700 mb-2 md:mb-3">
            Share your experience (optional)
          </label>
          <textarea
            id={`comment-${order._id}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
            placeholder="What did you like about the food and service?"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1 md:mt-2 text-right">
            {comment.length}/500
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full md:w-auto px-6 py-2 md:py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}