import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Server as ServerIcon, Database as DatabaseIcon, ChevronDown } from 'lucide-react';
import { getHealth } from '../services/api';

const HealthBadge = () => {
  const [health, setHealth] = useState({
    status: 'checking',
    timestamp: undefined,
    services: {
      server: { status: 'unknown' },
      database: { status: 'unknown' }
    },
    system: undefined
  });
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const checkHealth = async () => {
      try {
        const data = await getHealth();
        if (!cancelled) setHealth(data);
      } catch {
        if (!cancelled) {
          setHealth((prev) => ({
            ...prev,
            status: 'unhealthy',
            services: {
              server: { status: 'unhealthy', message: 'Connection failed' },
              database: { status: 'unknown', message: 'Unable to check' }
            }
          }));
        }
      }
    };

    // initial
    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Close popover on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const tone = useMemo(() => {
    const s = health.status;
    if (s === 'healthy') {
      return {
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
      };
    }
    if (s === 'unhealthy') {
      return {
        dot: 'bg-rose-500',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
      };
    }
    // checking/unknown
    return {
      dot: 'bg-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
    };
  }, [health.status]);

  const formatAgo = (iso) => {
    if (!iso) return '—';
    const then = new Date(iso).getTime();
    const now = Date.now();
    const sec = Math.max(0, Math.floor((now - then) / 1000));
    if (sec < 5) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    return `${hrs}h ago`;
  };

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${tone.bg} ${tone.border} ${tone.text} transition-all duration-200 shadow-sm hover:shadow`}
        aria-expanded={open}
        aria-label="System health status"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${tone.dot} ${health.status === 'checking' ? 'animate-pulse' : ''}`} />
        <span className="inline-flex items-center gap-1 text-sm font-medium">
          <Activity size={14} />
          Health
        </span>
        <span className="hidden sm:inline text-xs capitalize opacity-80">{health.status}</span>
        <ChevronDown size={14} className={`opacity-70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-xl p-3 z-50"
          role="dialog"
          aria-label="Health details"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <ServerIcon size={16} className="text-gray-500" />
                <span className="text-sm">Server</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`inline-block w-2 h-2 rounded-full ${health.services?.server?.status === 'healthy' ? 'bg-emerald-500' : health.services?.server?.status === 'unhealthy' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                <span className="capitalize text-gray-700">{health.services?.server?.status || 'unknown'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <DatabaseIcon size={16} className="text-gray-500" />
                <span className="text-sm">Database</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`inline-block w-2 h-2 rounded-full ${health.services?.database?.status === 'healthy' ? 'bg-emerald-500' : health.services?.database?.status === 'unhealthy' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                <span className="capitalize text-gray-700">{health.services?.database?.status || 'unknown'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Last checked</span>
                <span>{formatAgo(health.timestamp)}</span>
              </div>
              {health.system && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1">
                    <span>Uptime</span>
                    <span>{Math.floor((health.system.uptime || 0) / 60)}m</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1">
                    <span>Memory</span>
                    <span>{health.system.memory?.usagePercent?.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthBadge;