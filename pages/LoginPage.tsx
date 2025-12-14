import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { isSupabaseConfigured } from '../supabaseClient';
import { Lock, User as UserIcon, AlertCircle, Database, Settings } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Config State
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');

  useEffect(() => {
    // If not configured, show config screen by default
    if (!isSupabaseConfigured()) {
      setShowConfig(true);
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

  if (showConfig) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mx-auto h-12 w-12 bg-gray-600 rounded-xl flex items-center justify-center">
                    <Database className="text-white w-6 h-6" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                ตั้งค่าฐานข้อมูล
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                เชื่อมต่อกับโปรเจกต์ Supabase ของคุณ
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form onSubmit={handleSaveConfig} className="space-y-6">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Supabase URL</label>
                            <input
                                type="url"
                                required
                                value={configUrl}
                                onChange={(e) => setConfigUrl(e.target.value)}
                                placeholder="https://your-project.supabase.co"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Supabase Anon Key</label>
                            <input
                                type="text"
                                required
                                value={configKey}
                                onChange={(e) => setConfigKey(e.target.value)}
                                placeholder="your-anon-key"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        
                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <div className="flex gap-2">
                             <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                            >
                                บันทึกและเชื่อมต่อ
                            </button>
                             {isSupabaseConfigured() && (
                                <button
                                    type="button"
                                    onClick={() => setShowConfig(false)}
                                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                    ยกเลิก
                                </button>
                             )}
                        </div>
                    </form>
                     <div className="mt-4 text-xs text-gray-500 text-center">
                        ข้อมูลเหล่านี้จะถูกบันทึกไว้ในเบราว์เซอร์ของคุณ (Local Storage)
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Lock className="text-white w-6 h-6" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          EduMeet
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          เข้าสู่ระบบเพื่อจองห้องประชุม
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 relative">
          
          <button 
            onClick={() => setShowConfig(true)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            title="ตั้งค่าฐานข้อมูล"
          >
            <Settings className="w-5 h-5" />
          </button>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ชื่อผู้ใช้ (Username)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                รหัสผ่าน (Password)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-400">
            รหัสทดสอบ: admin / admin123
          </div>
        </div>
      </div>
    </div>
  );
};