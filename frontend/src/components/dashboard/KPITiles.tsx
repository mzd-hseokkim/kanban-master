import { DashboardSummaryResponse } from '@/types/dashboard';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface KPITilesProps {
  summary: DashboardSummaryResponse;
}

export const KPITiles: React.FC<KPITilesProps> = ({ summary }) => {
  const { t } = useTranslation(['dashboard']);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">{t('dashboard:kpi.totalBoards')}</h3>
        <p className="text-2xl font-bold text-gray-900">{summary.totalBoards}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">{t('dashboard:kpi.totalCards')}</h3>
        <p className="text-2xl font-bold text-gray-900">{summary.totalCards}</p>
        <div className="text-xs text-gray-600 mt-1">
          {t('dashboard:kpi.completedVsIncomplete', {
            completed: summary.completedCards,
            incomplete: summary.incompleteCards,
          })}
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">{t('dashboard:kpi.overdueCards')}</h3>
        <p className="text-2xl font-bold text-red-600">{summary.overdueCards}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">{t('dashboard:kpi.dueSoon')}</h3>
        <p className="text-2xl font-bold text-yellow-600">{summary.dueSoonCards}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">{t('dashboard:kpi.highPriorityUnassigned')}</h3>
        <p className="text-2xl font-bold text-orange-600">{summary.unassignedHighPriorityCards}</p>
      </div>
    </div>
  );
};
