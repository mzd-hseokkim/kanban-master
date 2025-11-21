import { RecentActivity } from '@/types/dashboard';
import React from 'react';

interface ActivityTrendProps {
  activity: RecentActivity;
}

export const ActivityTrend: React.FC<ActivityTrendProps> = ({ activity }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Activity (Last 7 Days)</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-3xl font-bold text-blue-600">{activity.created7d}</p>
          <p className="text-sm text-gray-600 mt-1">Cards Created</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-3xl font-bold text-green-600">{activity.updated7d}</p>
          <p className="text-sm text-gray-600 mt-1">Cards Updated</p>
        </div>
      </div>
    </div>
  );
};
