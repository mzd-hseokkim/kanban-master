import { AuditLog, AuditLogParams, getAuditLogs } from '@/services/AuditLogService';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [params, setParams] = useState<AuditLogParams>({
    page: 0,
    size: 20,
    sort: 'createdAt,desc',
  });

  // Filters
  const [targetType, setTargetType] = useState('');
  const [targetId, setTargetId] = useState('');
  const [actorId, setActorId] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams: AuditLogParams = { ...params };
      if (targetType) queryParams.targetType = targetType;
      if (targetId) queryParams.targetId = targetId;
      if (actorId) queryParams.actorId = parseInt(actorId);

      const data = await getAuditLogs(queryParams);
      setLogs(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [params.page, params.size]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ ...params, page: 0 }); // Reset to first page
    fetchLogs();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setParams({ ...params, page: newPage });
    }
  };

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const renderDiff = (log: AuditLog) => {
    if (!log.changes) return <span className="text-gray-400">-</span>;

    const isExpanded = expandedRows.has(log.id);

    try {
      const diff = JSON.parse(log.changes);
      const diffStr = JSON.stringify(diff, null, 2);
      const preview = diffStr.length > 50 ? diffStr.substring(0, 50) + '...' : diffStr;

      return (
        <div className="flex items-start gap-2">
          <button
            onClick={() => toggleRow(log.id)}
            className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap"
          >
            {isExpanded ? 'Hide' : 'Show'}
          </button>
          {isExpanded ? (
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96 max-w-lg">
              {diffStr}
            </pre>
          ) : (
            <span className="text-xs text-gray-600 truncate max-w-[200px]" title={diffStr}>
              {preview}
            </span>
          )}
        </div>
      );
    } catch (e) {
      return <span className="text-red-500 text-xs">Invalid JSON</span>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Audit Logs</h1>

      {/* Filters */}
      <form onSubmit={handleFilterSubmit} className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="BOARD">Board</option>
            <option value="COLUMN">Column</option>
            <option value="CARD">Card</option>
            <option value="MEMBER">Member</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target ID</label>
          <input
            type="text"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="ID"
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Actor ID</label>
          <input
            type="number"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            placeholder="User ID"
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="w-40 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP / UA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No logs found</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.targetType} <span className="text-gray-500">#{log.targetId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      User #{log.actorId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{log.ipAddress || '-'}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[150px]" title={log.userAgent}>
                        {log.userAgent || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {renderDiff(log)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(params.page! - 1)}
              disabled={params.page === 0}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(params.page! + 1)}
              disabled={params.page! >= totalPages - 1}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{params.page! + 1}</span> of <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(params.page! - 1)}
                  disabled={params.page === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(params.page! + 1)}
                  disabled={params.page! >= totalPages - 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
