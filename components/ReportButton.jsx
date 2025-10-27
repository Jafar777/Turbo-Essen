// components/ReportButton.jsx
'use client';
import { useState } from 'react';
import { MdReport } from 'react-icons/md';
import ReportModal from './ReportModal';

export default function ReportButton({ targetType, targetId, targetName, size = 'sm' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors duration-200 ${sizes[size]}`}
        title={`Report ${targetType}`}
      >
        <MdReport className="w-4 h-4" />
        <span>Report</span>
      </button>

      {isModalOpen && (
        <ReportModal
          targetType={targetType}
          targetId={targetId}
          targetName={targetName}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}