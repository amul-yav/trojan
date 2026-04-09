import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Flame, 
  AlertTriangle, 
  FileText, 
  RefreshCw,
  Globe,
  LogOut,
  User,
  Shield,
  BarChart2,
  Bot,
  ShieldAlert,
  Gavel,
  Bell
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UserContext, AlertRecord } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
  lastRefreshed?: string;
  status?: string;
  userContext: UserContext | null;
  onLogout: () => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  alertHistory?: AlertRecord[];
}

const navItems = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'City Analysis', icon: BarChart3 },
  { name: 'EDA Explorer', icon: BarChart2 },
  { name: 'Agent Activity', icon: Bot },
  { name: 'Compliance Log', icon: ShieldAlert },
  { name: 'Policy Actions', icon: Gavel },
  { name: 'Fire Tracker', icon: Flame },
  { name: 'Reports', icon: FileText },
  { name: 'Alert Settings', icon: Bell },
];

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onRefresh, 
  lastRefreshed, 
  status, 
  userContext, 
  onLogout,
  refreshInterval,
  setRefreshInterval,
  alertHistory = []
}: SidebarProps) {
  const hasNewAlerts = alertHistory.some(a => a.emailSent && (Date.now() - new Date(a.triggeredAt).getTime() < 300000));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-[1001]">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-slate-900 p-1.5 rounded-lg shadow-lg shadow-slate-200">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">EcoSentinel</h1>
        </div>
        <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">
          AI Intelligence Platform
        </p>
      </div>

      {userContext && (
        <div className="mx-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
              <User size={16} className="text-slate-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Role</p>
              <p className="text-xs font-bold text-slate-900 truncate">{userContext.role}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-tight">
              {userContext.jurisdiction.name}
            </div>
            <button 
              onClick={onLogout}
              className="text-slate-400 hover:text-red-500 transition-colors p-1 hover:bg-white rounded-md shadow-sm border border-transparent hover:border-slate-100"
              title="Switch Role"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveTab(item.name)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative",
              activeTab === item.name 
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon size={18} />
            {item.name}
            {item.name === 'Alert Settings' && hasNewAlerts && (
              <span className="absolute top-3 right-4 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">System Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={cn("w-2 h-2 rounded-full", status === 'healthy' ? "bg-green-500 animate-pulse" : "bg-yellow-500")} />
              <span className="text-[10px] font-black uppercase text-slate-700">{status === 'healthy' ? 'Live' : 'Cached'}</span>
            </div>
          </div>
          <button 
            onClick={onRefresh}
            className="p-2 bg-white border border-slate-200 rounded-xl transition-all text-slate-400 hover:text-blue-600 shadow-sm hover:shadow-md active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={status === 'healthy' ? '' : 'animate-spin'} />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Refresh Interval</span>
            <span className="text-[10px] font-black text-blue-600">{refreshInterval}m</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="60" 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
        
        <div className="text-[9px] text-slate-400 text-center font-black uppercase tracking-widest">
          Updated: {lastRefreshed ? new Date(lastRefreshed).toLocaleTimeString() : 'Never'}
        </div>
      </div>
    </aside>
  );
}
