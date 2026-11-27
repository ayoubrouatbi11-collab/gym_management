import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDashboardData } from '../services/adminDashboardService';
import { computeStats, getRecentMembers, getUpcomingClasses } from '../utils/dashboardMetrics';

/**
 * useAdminDashboard — Custom hook that fetches dashboard data and computes
 * the derived metrics consumed by the AdminDashboardPage.
 *
 * @returns {{
 *   stats: { totalMembers: number, activeSubscriptions: number, scheduledClasses: number, totalBookings: number } | null,
 *   recentMembers: Array,
 *   upcomingClasses: Array,
 *   loading: boolean,
 *   error: string | null,
 *   refresh: () => void
 * }}
 */
export function useAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentMembers, setRecentMembers] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const data = await fetchDashboardData();

      if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
        return;
      }

      setStats(computeStats(data));
      setRecentMembers(getRecentMembers(data.users));
      setUpcomingClasses(getUpcomingClasses(data.classes));
    } catch (err) {
      if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
        return;
      }
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    stats,
    recentMembers,
    upcomingClasses,
    loading,
    error,
    refresh: loadData,
  };
}

export default useAdminDashboard;
