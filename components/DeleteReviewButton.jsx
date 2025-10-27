// components/DeleteReviewButton.jsx
'use client';
import { useState } from 'react';
import { MdDelete } from 'react-icons/md';

export default function DeleteReviewButton({ reviewId, onDelete }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        onDelete?.(reviewId);
      } else {
        alert(data.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
      title="Delete review"
    >
      <MdDelete className="w-4 h-4" />
      <span className="text-sm">Delete</span>
    </button>
  );
}