import React, { useState } from 'react';
import { 
  Cloud, 
  CheckCircle2, 
  Thermometer, 
  Wifi, 
  Settings2, 
  AlertCircle, 
  RefreshCcw, 
  LayoutDashboard, 
  Settings,
  Power,
  Lightbulb
} from 'lucide-react';

export default function App() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ledStatus, setLedStatus] = useState({
    temp: true,
    humidity: true,
    rain: false,
    wind: true,
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const toggleLed = (module: keyof typeof ledStatus) => {
    setLedStatus(prev => ({ ...prev, [module]: !prev[module] }));
  };

  return (
    <div className="min-h-screen pb-24 md:max-w-md mx-auto bg-[#f4f6f9] text-slate-800 font-sans shadow-xl md:my-8 md:rounded-3xl md:min-h-[850px] md:relative md:overflow-hidden relative">
      
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between sticky top-0 bg-[#f4f6f9]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 text-blue-600">
          <Cloud className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight text-slate-800">SkyBit</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Online
        </div>
      </header>

      <main className="px-5 flex flex-col gap-5">
        
        {/* Status Banner */}
        <div className="bg-green-50 border border-green-100 rounded-3xl p-5 flex gap-4 items-start shadow-sm shadow-green-100/50">
          <div className="bg-green-600 rounded-full p-1 mt-0.5 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">Normal Status</h3>
            <p className="text-sm text-green-700/80 mt-1 leading-snug">
              System is operating within optimal meteorological parameters.
            </p>
          </div>
        </div>

        {/* Main Temperature Card */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Current Temperature</span>
            <Thermometer className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-7xl font-bold text-blue-600 tracking-tighter">27.5</span>
            <span className="text-3xl font-medium text-blue-300">°C</span>
          </div>
          <div className="mt-4 inline-flex px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200/50">
            Condition: Clear Sky
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 mb-6">
            <Settings2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">System Status</h3>
          </div>
          <div className="grid grid-cols-3 gap-y-6">
            <StatusIndicator label="Wi-Fi" active color="bg-green-400" />
            <StatusIndicator label="API" active color="bg-blue-500" />
            <StatusIndicator label="Clear" active color="bg-green-400" />
            <StatusIndicator label="Rain" active={false} color="bg-slate-200" />
            <StatusIndicator label="Heat" active={false} color="bg-slate-200" />
            <StatusIndicator label="Error" active={false} color="bg-slate-200" />
          </div>
        </div>

        {/* NEW: LED Module Controls */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-800">Weather LED Indicators</h3>
          </div>
          <div className="space-y-3">
            <LedModuleRow 
              label="Temperature" 
              status="Warm (27.5°C)" 
              active={ledStatus.temp} 
              colorClass="bg-red-500" 
              onToggle={() => toggleLed('temp')} 
            />
            <LedModuleRow 
              label="Humidity" 
              status="Normal (54%)" 
              active={ledStatus.humidity} 
              colorClass="bg-green-500" 
              onToggle={() => toggleLed('humidity')} 
            />
            <LedModuleRow 
              label="Rain Probability" 
              status="Low (20%)" 
              active={ledStatus.rain} 
              colorClass="bg-blue-500" 
              onToggle={() => toggleLed('rain')} 
            />
            <LedModuleRow 
              label="Wind Speed" 
              status="Breezy (18.2 km/h)" 
              active={ledStatus.wind} 
              colorClass="bg-amber-400" 
              onToggle={() => toggleLed('wind')} 
            />
          </div>
        </div>

        {/* ESP32 Live Preview */}
        <div className="bg-[#2a2b32] rounded-3xl p-1 shadow-lg overflow-hidden border border-slate-700/50">
          <div className="bg-[#1f1f23] rounded-[22px] p-5">
             <div className="flex items-center gap-2 mb-4 opacity-70">
              <span className="w-4 h-4 rounded shadow-sm border border-slate-600 flex items-center justify-center p-0.5">
                <div className="w-full h-full bg-slate-500/50 rounded-sm"></div>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">ESP32 Live Preview</span>
            </div>
            
            {/* The Screen */}
            <div className="bg-black rounded-xl p-6 aspect-[2/1] flex flex-col items-center justify-center shadow-inner border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(0,0,0,0.4)_2px,rgba(0,0,0,0.4)_4px)] opacity-20 pointer-events-none"></div>
              <div className="font-mono text-xl sm:text-2xl text-green-500 font-bold tracking-wide flex flex-col items-center gap-2" style={{ textShadow: '0 0 8px rgba(34, 197, 94, 0.4)' }}>
                <span>TEMP: 27.5C</span>
                <span>HUM:  54%</span>
              </div>
            </div>
            
            <RequestBanner />
          </div>
        </div>

        {/* Manual Refresh Button */}
        <button 
          onClick={handleRefresh}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-semibold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-blue-600/20"
        >
          <RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Manual Refresh
        </button>

      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full md:absolute bg-[#f4f6f9]/90 backdrop-blur-xl border-t border-slate-200/50 pb-safe pt-2">
        <div className="flex justify-around items-center h-16">
          <NavButton icon={<LayoutDashboard />} label="Dashboard" active />
          <NavButton icon={<Settings />} label="Settings" />
        </div>
      </nav>

    </div>
  );
}

// Sub-components

function StatusIndicator({ label, active, color }: { label: string, active: boolean, color: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-10 h-10 rounded-full border-[3px] border-white/50 shadow-sm flex items-center justify-center transition-colors ${active ? color : 'bg-[#e2e8f0]'}`}>
        <div className={`w-full h-full rounded-full opacity-0 ${active && 'animate-ping opacity-20 bg-white'}`}></div>
      </div>
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function RequestBanner() {
  return (
    <div className="text-center mt-4">
      <span className="text-[11px] text-slate-500 font-medium tracking-wide">Rendering at 128x64 px</span>
    </div>
  );
}

function LedModuleRow({ label, status, active, colorClass, onToggle }: { label: string, status: string, active: boolean, colorClass: string, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full border-[3px] border-white shadow-sm flex items-center justify-center transition-colors ${active ? colorClass : 'bg-slate-200'}`}>
           <div className={`w-full h-full rounded-full opacity-0 ${active && 'animate-ping opacity-20 bg-white'}`}></div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          <span className="text-xs font-medium text-slate-500 mt-0.5">{status}</span>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 flex-shrink-0 ${active ? colorClass : 'bg-slate-300'}`}
        role="switch"
        aria-checked={active}
      >
        <span 
          className={`block w-5 h-5 bg-white rounded-full absolute top-[2px] transition-transform duration-300 ease-in-out shadow-sm ${active ? 'translate-x-[26px]' : 'translate-x-[2px]'}`}
        />
      </button>
    </div>
  );
}

function NavButton({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex flex-col items-center justify-center w-24 gap-1 p-2 rounded-2xl transition-all ${active ? 'bg-green-400/20 text-green-700' : 'text-slate-400 hover:bg-black/5'}`}>
      <div className="w-5 h-5 [&>svg]:w-full [&>svg]:h-full">{icon}</div>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
