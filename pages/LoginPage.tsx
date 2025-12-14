import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { isSupabaseConfigured, checkConnection } from '../supabaseClient';
import { Lock, User as UserIcon, AlertCircle, Database, Settings, Sparkles, Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'not_configured';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Connection Status State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [connectionLatency, setConnectionLatency] = useState<number | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Config State
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');

  const checkConnectionStatus = async () => {
    setIsCheckingConnection(true);
    setConnectionStatus('checking');

    if (!isSupabaseConfigured()) {
      setConnectionStatus('not_configured');
      setConnectionError('ยังไม่ได้ตั้งค่า Supabase');
      setIsCheckingConnection(false);
      return;
    }

    const result = await checkConnection();

    if (result.connected) {
      setConnectionStatus('connected');
      setConnectionLatency(result.latency || null);
      setConnectionError(result.error || null);
    } else {
      setConnectionStatus('disconnected');
      setConnectionError(result.error || 'ไม่สามารถเชื่อมต่อได้');
    }

    setIsCheckingConnection(false);
  };

  useEffect(() => {
    // If not configured, show config screen by default
    if (!isSupabaseConfigured()) {
      setShowConfig(true);
      setConnectionStatus('not_configured');
    } else {
      // Check connection on mount
      checkConnectionStatus();
    }

    // Load existing local config if any
    const localUrl = localStorage.getItem('sb_url');
    const localKey = localStorage.getItem('sb_key');
    if (localUrl) setConfigUrl(localUrl);
    if (localKey) setConfigKey(localKey);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured() && !showConfig) {
      setError('กรุณาตั้งค่าการเชื่อมต่อฐานข้อมูลก่อน (Supabase)');
      setLoading(false);
      setShowConfig(true);
      return;
    }

    try {
      const user = await api.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes('fetch') || err.message.includes('apikey'))) {
        setError('การเชื่อมต่อล้มเหลว กรุณาตรวจสอบการตั้งค่า Supabase');
        setShowConfig(true);
      } else {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configUrl || !configKey) {
      setError("จำเป็นต้องระบุ URL และ Key");
      return;
    }
    localStorage.setItem('sb_url', configUrl);
    localStorage.setItem('sb_key', configKey);
    window.location.reload(); // Reload to re-init supabase client
  };

  // Connection Status Badge Component
  const ConnectionStatusBadge = () => {
    const getStatusConfig = () => {
      switch (connectionStatus) {
        case 'checking':
          return {
            icon: <RefreshCw className="w-4 h-4 animate-spin" />,
            text: 'กำลังตรวจสอบ...',
            bgClass: 'bg-gray-100 text-gray-600 border-gray-200',
            dotClass: 'bg-gray-400'
          };
        case 'connected':
          return {
            icon: <Wifi className="w-4 h-4" />,
            text: connectionLatency ? `เชื่อมต่อแล้ว (${connectionLatency}ms)` : 'เชื่อมต่อแล้ว',
            bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dotClass: 'bg-emerald-500 animate-pulse'
          };
        case 'disconnected':
          return {
            icon: <WifiOff className="w-4 h-4" />,
            text: 'ไม่สามารถเชื่อมต่อได้',
            bgClass: 'bg-red-50 text-red-700 border-red-200',
            dotClass: 'bg-red-500'
          };
        case 'not_configured':
          return {
            icon: <Database className="w-4 h-4" />,
            text: 'ยังไม่ได้ตั้งค่า',
            bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
            dotClass: 'bg-amber-500'
          };
        default:
          return {
            icon: <Database className="w-4 h-4" />,
            text: 'ไม่ทราบสถานะ',
            bgClass: 'bg-gray-100 text-gray-600 border-gray-200',
            dotClass: 'bg-gray-400'
          };
      }
    };

    const config = getStatusConfig();

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${config.bgClass} transition-all duration-300`}>
        <span className={`w-2 h-2 rounded-full ${config.dotClass}`}></span>
        {config.icon}
        <span>{config.text}</span>
        {connectionStatus !== 'checking' && (
          <button
            onClick={checkConnectionStatus}
            disabled={isCheckingConnection}
            className="ml-1 p-1 hover:bg-white/50 rounded-full transition-colors"
            title="ตรวจสอบการเชื่อมต่ออีกครั้ง"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConnection ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    );
  };

  if (showConfig) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Floating decorative shapes */}
        <div className="floating-shape floating-shape-1"></div>
        <div className="floating-shape floating-shape-2"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in-up">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl animate-float">
            <Database className="text-white w-8 h-8" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            ตั้งค่าฐานข้อมูล
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            เชื่อมต่อกับโปรเจกต์ Supabase ของคุณ
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in-up stagger-2">
          <div className="glass-card py-8 px-6 sm:px-10">
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supabase URL</label>
                <input
                  type="url"
                  required
                  value={configUrl}
                  onChange={(e) => setConfigUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supabase Anon Key</label>
                <input
                  type="text"
                  required
                  value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                  placeholder="your-anon-key"
                  className="input-modern"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1 flex justify-center items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  บันทึกและเชื่อมต่อ
                </button>
                {isSupabaseConfigured() && (
                  <button
                    type="button"
                    onClick={() => setShowConfig(false)}
                    className="btn-secondary"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            </form>
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                ข้อมูลเหล่านี้จะถูกบันทึกไว้ในเบราว์เซอร์ของคุณ
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating decorative shapes */}
      <div className="floating-shape floating-shape-1"></div>
      <div className="floating-shape floating-shape-2"></div>
      <div className="floating-shape floating-shape-3"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in-up">
        <div className="mx-auto h-20 w-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
          <Lock className="text-white w-10 h-10" />
        </div>
        <h2 className="mt-6 text-center text-4xl font-bold text-white tracking-tight">
          EduMeet
        </h2>
        <p className="mt-3 text-center text-gray-300">
          ระบบจองห้องประชุมอัจฉริยะ
        </p>

        {/* Connection Status Badge */}
        <div className="mt-4 flex justify-center">
          <ConnectionStatusBadge />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in-up stagger-2">
        <div className="glass-card py-10 px-6 sm:px-10 relative">

          <button
            onClick={() => setShowConfig(true)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
            title="ตั้งค่าฐานข้อมูล"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Connection Error Alert */}
          {connectionStatus === 'disconnected' && connectionError && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <WifiOff className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">ไม่สามารถเชื่อมต่อ Server ได้</p>
                  <p className="text-xs text-red-600 mt-1">{connectionError}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-modern pl-11"
                  placeholder="กรอกชื่อผู้ใช้"
                  disabled={connectionStatus === 'disconnected'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-modern pl-11"
                  placeholder="••••••••"
                  disabled={connectionStatus === 'disconnected'}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-red-100 rounded-full">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-sm font-medium text-red-700">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || connectionStatus === 'disconnected' || connectionStatus === 'checking'}
              className="w-full btn-primary py-3 text-base flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  กำลังเข้าสู่ระบบ...
                </>
              ) : connectionStatus === 'checking' ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  กำลังตรวจสอบการเชื่อมต่อ...
                </>
              ) : connectionStatus === 'disconnected' ? (
                <>
                  <WifiOff className="w-5 h-5" />
                  ไม่สามารถเชื่อมต่อได้
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  เข้าสู่ระบบ
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              รหัสทดสอบ: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">admin / admin123</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
    </div>
  );
};