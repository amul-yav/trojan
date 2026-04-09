import React, { useState } from 'react';
import _ from 'lodash';
import { PipelineResults, AgentEvent } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine
} from 'recharts';
import { Bot, Clock, CheckCircle2, AlertCircle, Loader2, LayoutGrid, List } from 'lucide-react';

interface AgentActivityProps {
  results: PipelineResults;
}

export default function AgentActivity({ results }: AgentActivityProps) {
  const [view, setView] = useState<'list' | 'timeline'>('list');
  const agentState = results.agentState;
  const events = agentState.events;

  const latestEvents = _(events)
    .groupBy('agentName')
    .mapValues(group => _.last(group)!)
    .values()
    .value();

  const stats = {
    total: latestEvents.length,
    done: latestEvents.filter(e => e.status === 'done').length,
    running: latestEvents.filter(e => e.status === 'running').length,
    errors: latestEvents.filter(e => e.status === 'error').length
  };

  const timelineData = latestEvents
    .filter(e => e.durationMs !== undefined)
    .map(e => ({
      name: e.agentName,
      duration: e.durationMs || 0
    }));

  return (
    <div className="space-y-8">
      {/* Summary Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Agent Orchestration</h2>
            <p className="text-sm text-slate-500">Live multi-agent coordination feed</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <StatItem label="Total Agents" value={stats.total} />
          <StatItem label="Completed" value={stats.done} color="text-green-600" />
          <StatItem label="Running" value={stats.running} color="text-amber-600" />
          <StatItem label="Errors" value={stats.errors} color="text-red-600" />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            <List size={18} />
          </button>
          <button 
            onClick={() => setView('timeline')}
            className={`p-2 rounded-lg transition-all ${view === 'timeline' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="grid grid-cols-1 gap-4">
          {latestEvents.map((event, idx) => (
            <AgentRow key={idx} event={event} isCurrent={agentState.currentAgent === event.agentName} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Execution Timeline (ms)</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px' }}
                />
                <Bar dataKey="duration" radius={[0, 4, 4, 0]} barSize={32}>
                  {timelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, color = "text-slate-900" }: any) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function AgentRow({ event, isCurrent }: { event: AgentEvent, isCurrent: boolean, key?: any }) {
  const getStatusIcon = () => {
    switch (event.status) {
      case 'running': return <Loader2 className="text-amber-500 animate-spin" size={18} />;
      case 'done': return <CheckCircle2 className="text-green-500" size={18} />;
      case 'error': return <AlertCircle className="text-red-500" size={18} />;
    }
  };

  return (
    <div className={`bg-white border rounded-2xl p-5 flex items-center justify-between transition-all ${
      isCurrent ? 'border-blue-500 shadow-md ring-2 ring-blue-50' : 'border-slate-200 shadow-sm'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          event.status === 'running' ? 'bg-amber-50' : 
          event.status === 'done' ? 'bg-green-50' : 'bg-red-50'
        }`}>
          {getStatusIcon()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900">{event.agentName} Agent</h4>
            {isCurrent && (
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium">{event.message}</p>
        </div>
      </div>
      <div className="text-right">
        {event.durationMs && (
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Clock size={12} />
            <span className="text-[10px] font-bold">{event.durationMs}ms</span>
          </div>
        )}
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          {new Date(event.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
