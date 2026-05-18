import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wifi,
  Activity,
  Server,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Radio,
  Settings,
  MessageSquare,
  Zap,
  MonitorPlay,
  RotateCw,
  Palette,
  Power,
  Loader2
} from 'lucide-react';
import Wheel from '@uiw/react-color-wheel';
import { hexToHsva, hsvaToRgba } from '@uiw/color-convert';



import { useMemo } from "react";
import {

  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Clock,
} from "lucide-react";

type OledDisplayMode = "static" | "scroll";

type OledAnimSpeed = "slow" | "normal" | "fast";

type WeatherData = {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  updatedAt?: Date | string;
};

type OledScreenControlCardProps = {
  oledText: string;
  oledDisplayMode: OledDisplayMode;
  oledSize: OledSize;
  oledAnimSpeed: OledAnimSpeed;

  weather?: WeatherData;

  handleOledTextChange: (value: string) => void;
  handleOledDisplayModeChange: (mode: OledDisplayMode) => void;
  handleOledSizeChange: (size: OledSize) => void;
  handleOledSpeedChange: (speed: OledAnimSpeed) => void;
};

const MAX_OLED_CHARS = 32;

const API_BASE_URL = 'https://skybit-api.mahros.dev/api/v1';

// --- Types ---
type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
type LedMode = 'solid' | 'off';
type OledMode = 'static' | 'scroll';
type OledSize = 'small' | 'medium' | 'large';
type OledSpeed = 'slow' | 'normal' | 'fast';

interface ActivityLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'connection' | 'led' | 'oled' | 'system';
}

export default function App() {
  // --- State ---
  const [status, setStatus] = useState<ConnectionStatus>('connecting' as any);

  // LED State
  const [ledColor, setLedColor] = useState('#fff'); // Initial blue
  const [ledMode, setLedMode] = useState<LedMode>('solid');

  // Derived RGB from Hex
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
  };

  const currentRgb = hexToRgb(ledColor);

  // OLED State
  const [oledText, setOledText] = useState('mahros');
  const [oledDisplayMode, setOledDisplayMode] = useState<OledMode>('static');
  const [oledSize, setOledSize] = useState<OledSize>('medium');
  const [oledAnimSpeed, setOledAnimSpeed] = useState<OledSpeed>('normal');

  const [isUpdatingScreen, setIsUpdatingScreen] = useState(false);

  // --- Handlers ---
  const connectToApi = async () => {
    try {
      setStatus('reconnecting');
      const res = await fetch(`${API_BASE_URL}/state`);
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      if (json.success && json.data) {
        setStatus('connected');
        const d = json.data;
        if (d.led) {
          setLedColor(rgbToHex(d.led.r, d.led.g, d.led.b));
          setLedMode(d.led.mode);
        }
        if (d.screen) {
          setOledText(d.screen.text);
          setOledDisplayMode(d.screen.mode);
          setOledSize(d.screen.size === 1 ? 'small' : d.screen.size === 3 ? 'large' : 'medium');
          setOledAnimSpeed(d.screen.speedMs <= 15 ? 'fast' : d.screen.speedMs >= 80 ? 'slow' : 'normal');
        }
      } else {
        setStatus('disconnected');
      }
    } catch {
      setStatus('disconnected');
    }
  };

  const patchApi = async (payload: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch (error) {
      console.error(error);
      setStatus('disconnected');
    }
  };

  const ledDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedPatchLed = useCallback((r: number, g: number, b: number, mode: string) => {
    if (ledDebounceRef.current) clearTimeout(ledDebounceRef.current);
    ledDebounceRef.current = setTimeout(() => {
      patchApi({
        led: { r, g, b, mode }
      });
    }, 200);
  }, []);

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...currentRgb, [channel]: value };
    setLedColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    debouncedPatchLed(newRgb.r, newRgb.g, newRgb.b, ledMode);
  };

  const handleHexChange = (hex: string) => {
    setLedColor(hex);
    const rgb = hexToRgb(hex);
    debouncedPatchLed(rgb.r, rgb.g, rgb.b, ledMode);
  };

  const handleLedModeChange = (mode: LedMode) => {
    setLedMode(mode);
    debouncedPatchLed(currentRgb.r, currentRgb.g, currentRgb.b, mode);
  };

  const screenDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedPatchScreen = useCallback((text: string, mode: string, size: string, speed: string) => {
    if (screenDebounceRef.current) clearTimeout(screenDebounceRef.current);
    screenDebounceRef.current = setTimeout(() => {
      let speedMs = 30;
      if (speed === 'slow') speedMs = 100;
      if (speed === 'fast') speedMs = 10;

      let sizeNum = 2;
      if (size === 'small') sizeNum = 1;
      if (size === 'large') sizeNum = 3;

      patchApi({
        screen: {
          text,
          mode,
          speedMs,
          size: sizeNum
        }
      });
    }, 500);
  }, []);

  const handleOledTextChange = (text: string) => {
    setOledText(text);
    debouncedPatchScreen(text, oledDisplayMode, oledSize, oledAnimSpeed);
  };

  const handleOledDisplayModeChange = (mode: OledMode) => {
    setOledDisplayMode(mode);
    debouncedPatchScreen(oledText, mode, oledSize, oledAnimSpeed);
  };

  const handleOledSizeChange = (size: OledSize) => {
    setOledSize(size);
    debouncedPatchScreen(oledText, oledDisplayMode, size, oledAnimSpeed);
  };

  const handleOledSpeedChange = (speed: OledSpeed) => {
    setOledAnimSpeed(speed);
    debouncedPatchScreen(oledText, oledDisplayMode, oledSize, speed);
  };

  // --- API Sync Effects ---
  useEffect(() => {
    connectToApi();

    // Heartbeat to keep connection status updated
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/state`);
        if (res.ok) {
          setStatus('connected');
        } else {
          setStatus('disconnected');
        }
      } catch {
        setStatus('disconnected');
      }
    }, 10000); // every 10s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen pb-12">
      {/* HEADER */}
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-10 w-full">
        <div className="flex items-center gap-4">
          {/* <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200"> */}
          <img className=" h-10 text-white" src='/web-app-manifest-512x512.png' />
          {/* </div> */}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none mb-1">SkyBit</h1>
            <p className="text-xs text-slate-500 font-medium leading-none">Real-time IoT display and RGB controller</p>
          </div>
        </div>
        <a href="https://www.mahros.dev" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          Who am i?
        </a>
      </header>

      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden max-w-7xl mx-auto w-full">

        {/* TOP FLASH MESSAGE / DISCONNECTED STATE MODAL-ISH BANNER */}
        {status === 'disconnected' && (
          <div className="col-span-12 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-500">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-800">Connection Lost</h3>
                <p className="text-xs font-medium text-red-600 mt-0.5">Attempting to establish connection with hardware...</p>
              </div>
            </div>
            <button onClick={connectToApi} className="px-4 py-2 bg-white text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
              Retry Connection
            </button>
          </div>
        )}

        <div className="col-span-12 items-center flex flex-col hover:*:shadow-md transition-shadow max-w-3xl mx-auto w-full">

          <div className="w-full flex flex-col gap-6">

            {/* RGB LED CONTROL CARD */}
            <Card title="RGB LED Control" subtitle="Change the physical LED color in real time." icon={<Palette className="text-slate-600" />}>
              <div className="flex flex-col md:flex-row gap-8 mb-2 items-center md:items-start justify-between">

                <div className="flex flex-col space-y-8 flex-1 w-full">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mode</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => handleLedModeChange('solid')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${ledMode === 'solid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Solid
                      </button>
                      <button
                        onClick={() => handleLedModeChange('off')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${ledMode === 'off' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Off
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 transition-opacity" style={{ opacity: ledMode === 'off' ? 0.5 : 1, pointerEvents: ledMode === 'off' ? 'none' : 'auto' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Color Presets</p>
                    <div className="flex gap-3 flex-wrap">
                      {['#ef4444', '#10b981', '#3b82f6', '#22d3ee', '#a855f7', '#0f172a', '#ffffff'].map(c => (
                        <button
                          key={c}
                          onClick={() => handleHexChange(c)}
                          className={`w-10 h-10 rounded-xl cursor-pointer border-2 border-white shadow-sm ring-1 ring-slate-200 transition-transform hover:scale-110 ${ledColor === c ? 'ring-offset-2 ring-blue-500 scale-110' : ''}`}
                          style={{ backgroundColor: c }}
                          title={`Set to ${c}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl shadow-inner border border-white transition-colors duration-300 relative flex items-center justify-center overflow-hidden ring-4 ring-slate-50"
                      style={{ backgroundColor: ledMode === 'off' ? '#1f2937' : ledColor, boxShadow: ledMode === 'solid' ? `0 0 20px -5px ${ledColor}` : 'none' }}
                    >
                      <div className="w-3 h-3 bg-white rounded-full blur-[2px] opacity-60 translate-x-2 -translate-y-2"></div>
                      {ledMode === 'off' && <Power className="text-slate-500 opacity-50 absolute" size={20} />}
                    </div>
                    <div className="font-mono flex flex-col">
                      <span className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-1">Current Color</span>
                      <span className="text-sm font-semibold text-slate-700">{ledMode === 'off' ? 'OFF' : ledColor.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center justify-center bg-slate-50 p-6 rounded-full border border-slate-100 shadow-inner overflow-hidden transition-opacity" style={{ opacity: ledMode === 'off' ? 0.5 : 1, pointerEvents: ledMode === 'off' ? 'none' : 'auto' }}>
                  <Wheel
                    width={200}
                    height={200}
                    color={hexToHsva(ledColor)}
                    onChange={(color) => {
                      const rgb = hsvaToRgba(color.hsva);
                      handleHexChange(rgbToHex(rgb.r, rgb.g, rgb.b));
                    }}
                  />
                </div>
              </div>
            </Card>

            <OledScreenControlCard
              oledText={oledText}
              oledDisplayMode={oledDisplayMode}
              oledSize={oledSize}
              oledAnimSpeed={oledAnimSpeed}
              weather={{
                location: "Cairo",
                temperature: 28,
                condition: "Clear",
                humidity: 42,
                windSpeed: 11,
                updatedAt: new Date(),
              }}
              handleOledTextChange={handleOledTextChange}
              handleOledDisplayModeChange={handleOledDisplayModeChange}
              handleOledSizeChange={handleOledSizeChange}
              handleOledSpeedChange={handleOledSpeedChange}
            />

            {/* OLED PREVIEW CARD */}
            <Card title="Live Preview" subtitle="Simulated 128x64 display output." icon={<MonitorPlay className="text-slate-600" />}>
              <div className="bg-slate-900 rounded-2xl border-4 border-slate-200 flex items-center justify-center relative overflow-hidden h-40">
                {/* OLED Screen Simulation */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:4px_4px]"></div>

                <div
                  className={`text-blue-400 font-mono tracking-widest uppercase z-10 whitespace-nowrap overflow-visible drop-shadow-[0_0_2px_rgba(96,165,250,0.8)]
                      ${oledSize === 'small' ? 'text-xs' : oledSize === 'medium' ? 'text-xl' : 'text-3xl'}
                      ${oledDisplayMode === 'scroll' ? 'animate-marquee' : ''}
                    `}
                  style={{
                    animationDuration: oledAnimSpeed === 'slow' ? '6s' : oledAnimSpeed === 'normal' ? '4s' : '2s',
                  }}
                >
                  {oledText || ' '}
                </div>

                <div className="absolute bottom-3 right-3 text-[10px] text-blue-400/40 font-mono">128x64 px</div>
              </div>
            </Card>

          </div>
        </div>

      </main>

      {/* Required for marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee linear infinite;
        }
      `}</style>
      <footer className="text-center text-xs text-slate-400 py-4">
        Developed with &hearts; by <a href="https://www.mahros.dev" className="underline hover:text-slate-600">0xQ4B4S</a>.
      </footer>
    </div>
  );
}


export function OledScreenControlCard({
  oledText,
  oledDisplayMode,
  oledSize,
  oledAnimSpeed,
  weather,
  handleOledTextChange,
  handleOledDisplayModeChange,
  handleOledSizeChange,
  handleOledSpeedChange,
}: OledScreenControlCardProps) {
  const quickPresets = useMemo(() => {
    const presets = [
      "0xQ4B4S",
      "Dr.Ashraf",
      "Hello World",
      "SkyBit IoT",
      new Date().toUTCString(),
    ];

    if (weather) {
      presets.push(
        `${weather.location}: ${Math.round(weather.temperature)}°C ${weather.condition}`
      );
    }

    return presets;
  }, [weather]);

  const safeTextChange = (value: string) => {
    handleOledTextChange(value.substring(0, MAX_OLED_CHARS));
  };

  const formattedUpdatedAt = weather?.updatedAt
    ? new Date(weather.updatedAt).toLocaleString()
    : "Live data";

  const weatherText = weather
    ? `${weather.location}: ${Math.round(weather.temperature)}°C ${weather.condition}`
    : "";

  return (
    <Card
      title="OLED Screen"
      subtitle="Control the text shown on the hardware display."
      icon={<MessageSquare className="text-slate-600" />}
    >
      <div className="space-y-5 mb-6">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
            Display Text
          </label>

          <input
            type="text"
            value={oledText}
            onChange={(e) => safeTextChange(e.target.value)}
            maxLength={MAX_OLED_CHARS}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
            placeholder="Enter text..."
          />

          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] font-medium text-slate-300">
              OLED-safe text limit
            </span>

            <span
              className={`text-[10px] font-bold ${oledText.length >= MAX_OLED_CHARS
                ? "text-red-500"
                : "text-slate-300"
                }`}
            >
              {oledText.length} / {MAX_OLED_CHARS}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {quickPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => safeTextChange(preset)}
                className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                title={preset}
              >
                {preset.length > 18 ? `${preset.substring(0, 18)}...` : preset}
              </button>
            ))}
          </div>
        </div>

        {weather && (
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CloudSun className="w-5 h-5 text-blue-500" />
                  <h4 className="text-sm font-extrabold text-slate-700">
                    Weather Snapshot
                  </h4>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  {weather.location}
                </p>
              </div>

              <button
                type="button"
                onClick={() => safeTextChange(weatherText)}
                className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                Show on OLED
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <WeatherMetric
                icon={<Thermometer className="w-4 h-4" />}
                label="Temp"
                value={`${Math.round(weather.temperature)}°C`}
              />

              <WeatherMetric
                icon={<CloudSun className="w-4 h-4" />}
                label="Condition"
                value={weather.condition}
              />

              <WeatherMetric
                icon={<Droplets className="w-4 h-4" />}
                label="Humidity"
                value={`${weather.humidity}%`}
              />

              <WeatherMetric
                icon={<Wind className="w-4 h-4" />}
                label="Wind"
                value={`${weather.windSpeed} km/h`}
              />
            </div>

            <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated: {formattedUpdatedAt}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Mode
            </label>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleOledDisplayModeChange("static")}
                className={`flex-1 px-2 py-2 text-xs font-bold rounded-lg transition-all ${oledDisplayMode === "static"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                Static
              </button>

              <button
                type="button"
                onClick={() => handleOledDisplayModeChange("scroll")}
                className={`flex-1 px-2 py-2 text-xs font-bold rounded-lg transition-all ${oledDisplayMode === "scroll"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                Scroll
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Text Size
            </label>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(["small", "medium", "large"] as OledSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleOledSizeChange(size)}
                  className={`flex-1 px-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${oledSize === size
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                    }`}
                  title={size}
                >
                  {size.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {oledDisplayMode === "scroll" && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Animation Speed
              </label>

              <span className="text-xs font-medium text-slate-500 capitalize">
                {oledAnimSpeed}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={
                oledAnimSpeed === "slow"
                  ? 1
                  : oledAnimSpeed === "normal"
                    ? 2
                    : 3
              }
              onChange={(e) => {
                const value = Number(e.target.value);

                handleOledSpeedChange(
                  value === 1 ? "slow" : value === 2 ? "normal" : "fast"
                );
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>
    </Card>
  );
}

type WeatherMetricProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function WeatherMetric({ icon, label, value }: WeatherMetricProps) {
  return (
    <div className="rounded-xl bg-white border border-slate-100 p-3 shadow-sm">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-bold">
          {label}
        </span>
      </div>

      <div className="text-sm font-extrabold text-slate-700 truncate">
        {value}
      </div>
    </div>
  );
}
// --- Reusable UI Components ---

function StatusChip({ status }: { status: ConnectionStatus }) {
  if (status === 'connected') {
    return (
      <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full shadow-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Device Connected</span>
      </div>
    );
  } else if (status === 'reconnecting') {
    return (
      <div className="flex items-center space-x-2 bg-amber-50 border border-amber-100 text-amber-700 px-4 py-2 rounded-full shadow-none">
        <RefreshCw size={12} className="animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider">Reconnecting</span>
      </div>
    );
  }
  return (
    <div className="flex items-center space-x-2 bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-full shadow-none">
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      <span className="text-xs font-bold uppercase tracking-wider">Disconnected</span>
    </div>
  );
}

function Card({ title, subtitle, icon, children }: { title: string, subtitle?: string, icon?: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className="flex items-center space-x-4 mb-6">
        {/* {icon && <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{icon}</div>} */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Button({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}

function RgbSlider({ label, colorClass, value, onChange }: { label: string, colorClass: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex items-center space-x-3 space-y-2">
      <span className="w-12 flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
        <span>{label}</span>
      </span>
      <input
        type="range"
        min="0" max="255"
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="flex-1 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
      />
      <span className="w-8 text-xs font-bold text-slate-900 text-right">{value}</span>
    </div>
  );
}
