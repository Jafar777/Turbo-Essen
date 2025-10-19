// components/RestaurantReviews.jsx
'use client';
import { FaStar, FaRegStar } from "react-icons/fa";

export default function RestaurantReviews({ restaurant, reviews }) {
  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) =>
          star <= rating ? (
            <FaStar key={star} className="w-4 h-4 text-amber-500" />
          ) : (
            <FaRegStar key={star} className="w-4 h-4 text-amber-500" />
          )
        )}
      </div>
    );
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Reviews Header */}
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        <div className="flex items-center space-x-4 mt-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {restaurant.averageRating || 0}
            </div>
            <div className="flex items-center justify-center mt-1">
              {renderStars(restaurant.averageRating || 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 ml-8">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating];
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-2 mb-1">
                  <span className="text-sm text-gray-600 w-4">{rating}</span>
                  <FaStar className="w-4 h-4 text-amber-500" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
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

      {/* Reviews List */}
      <div className="p-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-gray-800 text-lg font-semibold mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-600">
                Be the first to review this restaurant!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-start space-x-3">
                  {review.userImage ? (
                    <img
                      src={review.userImage}
                      alt={review.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {review.userName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">
                        {review.userName}
                      </h4>
                      <div className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-1">
                      {renderStars(review.rating)}
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 mt-2">{review.comment}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}