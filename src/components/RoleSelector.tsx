import React, { useState } from 'react';
import { UserRole, Jurisdiction, UserContext, CITIES, ThresholdConfig } from '../types';
import { Shield, MapPin, Building2, Landmark, ChevronRight, Search } from 'lucide-react';

interface RoleSelectorProps {
  onSelect: (context: UserContext) => void;
}

const ROLES: { role: UserRole; description: string; icon: any; jurisdictions: Jurisdiction[] }[] = [
  {
    role: 'Municipal Officer',
    description: 'Manage city-level monitoring and local enforcement.',
    icon: MapPin,
    jurisdictions: [
      { type: 'City', name: 'Bangalore' },
      { type: 'City', name: 'Delhi' },
      { type: 'City', name: 'Mumbai' },
    ]
  },
  {
    role: 'District Collector',
    description: 'Oversee district-wide hotspots and agricultural burning.',
    icon: Building2,
    jurisdictions: [
      { type: 'District', name: 'Patiala' },
      { type: 'District', name: 'Lucknow' },
      { type: 'District', name: 'Pune' },
    ]
  },
  {
    role: 'State Environment Board',
    description: 'Monitor inter-city trends and industrial compliance.',
    icon: Landmark,
    jurisdictions: [
      { type: 'State', name: 'Maharashtra' },
      { type: 'State', name: 'Karnataka' },
      { type: 'State', name: 'Punjab' },
    ]
  },
  {
    role: 'Central Ministry',
    description: 'National oversight and inter-state pollution movement.',
    icon: Shield,
    jurisdictions: [
      { type: 'National', name: 'India' }
    ]
  }
];

export default function RoleSelector({ onSelect }: RoleSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showThresholds, setShowThresholds] = useState(false);
  const [thresholds, setThresholds] = useState<ThresholdConfig>({
    country: 'India',
    standard: 'National',
    pollutantThresholds: {
      pm25: 60,
      pm10: 100,
      no2: 80
    }
  });

  const filteredCities = CITIES.filter(city => 
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (city.pincode && city.pincode.includes(searchTerm))
  ).slice(0, 5);

  const handleSelect = (role: UserRole, jurisdiction: Jurisdiction) => {
    onSelect({
      role,
      jurisdiction,
      thresholds
    });
  };

  const updateThreshold = (pollutant: keyof ThresholdConfig['pollutantThresholds'], value: number) => {
    setThresholds(prev => ({
      ...prev,
      pollutantThresholds: {
        ...prev.pollutantThresholds,
        [pollutant]: value
      }
    }));
  };

  const setStandard = (standard: ThresholdConfig['standard']) => {
    let newThresholds = { pm25: 60, pm10: 100, no2: 80 };
    if (standard === 'WHO') {
      newThresholds = { pm25: 15, pm10: 45, no2: 25 };
    } else if (standard === 'Calibrated') {
      newThresholds = { pm25: 40, pm10: 70, no2: 50 };
    }
    setThresholds(prev => ({
      ...prev,
      standard,
      pollutantThresholds: newThresholds
    }));
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
        <div className="md:w-1/3 bg-slate-900 p-12 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <span className="font-black tracking-tighter text-xl">EcoSentinel</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-4 leading-tight">Identify Your Jurisdiction</h1>
            <p className="text-slate-400 font-medium mb-8">Select your administrative role or search by city/pincode to access tailored environmental intelligence.</p>
            
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text"
                placeholder="Search city or pincode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <button 
              onClick={() => setShowThresholds(!showThresholds)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left mb-6"
            >
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Threshold Standard</p>
                <p className="text-sm font-bold">{thresholds.standard} Standards</p>
              </div>
              <ChevronRight size={16} className={showThresholds ? 'rotate-90 transition-transform' : 'transition-transform'} />
            </button>

            {showThresholds && (
              <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Select Standard</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['WHO', 'National', 'Calibrated'].map(s => (
                      <button
                        key={s}
                        onClick={() => setStandard(s as any)}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                          thresholds.standard === s ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <ThresholdInput label="PM2.5" value={thresholds.pollutantThresholds.pm25} onChange={v => updateThreshold('pm25', v)} />
                  <ThresholdInput label="PM10" value={thresholds.pollutantThresholds.pm10} onChange={v => updateThreshold('pm10', v)} />
                  <ThresholdInput label="NO2" value={thresholds.pollutantThresholds.no2} onChange={v => updateThreshold('no2', v)} />
                </div>
              </div>
            )}

            {searchTerm && filteredCities.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Quick Results</p>
                {filteredCities.map(city => (
                  <button
                    key={city.name}
                    onClick={() => handleSelect('Municipal Officer', { type: 'City', name: city.name })}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all text-left group/city"
                  >
                    <div>
                      <div className="text-sm font-bold group-hover/city:text-blue-400 transition-colors">{city.name}</div>
                      <div className="text-[10px] text-slate-500">{city.pincode || 'No Pincode'}</div>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover/city:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Government of India | Secure Access
          </div>
        </div>
        
        <div className="md:w-2/3 p-12 overflow-y-auto">
          <div className="grid gap-8">
            {ROLES.map((item) => (
              <div key={item.role} className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <item.icon size={18} className="text-slate-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{item.role}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {item.jurisdictions.map((jur) => (
                    <button
                      key={`${item.role}-${jur.name}`}
                      onClick={() => handleSelect(item.role, jur)}
                      className="group flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all text-left"
                    >
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{jur.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium line-clamp-1">{item.description}</div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThresholdInput({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-slate-400">{label} Limit</span>
      <input 
        type="number" 
        value={value} 
        onChange={e => onChange(Number(e.target.value))}
        className="w-16 bg-white/10 border border-white/10 rounded-lg py-1 px-2 text-[10px] font-black text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
