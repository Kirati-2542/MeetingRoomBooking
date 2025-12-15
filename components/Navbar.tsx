import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Calendar, LogOut, LayoutDashboard, Settings, Menu, X, Plus, User as UserIcon, CheckSquare, List, FileText, Sparkles, Database } from 'lucide-react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItemClass = (page: string) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${currentPage === page
      ? 'bg-gradient-to-r from-sky-400 via-blue-400 to-teal-400 text-white shadow-lg shadow-sky-400/25'
      : 'text-gray-600 hover:text-sky-600 hover:bg-sky-50'
    }`;

  const mobileNavItemClass = (page: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${currentPage === page
      ? 'bg-gradient-to-r from-sky-400 via-blue-400 to-teal-400 text-white'
      : 'text-gray-600 hover:text-sky-600 hover:bg-sky-50'
    }`;

  const getRoleBadge = () => {
    const roleStyles = {
      [UserRole.ADMIN]: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white',
      [UserRole.APPROVER]: 'bg-gradient-to-r from-teal-400 to-cyan-400 text-white',
      [UserRole.USER]: 'bg-gray-100 text-gray-600'
    };
    const roleNames = {
      [UserRole.ADMIN]: 'ผู้ดูแลระบบ',
      [UserRole.APPROVER]: 'ผู้อนุมัติ',
      [UserRole.USER]: 'ผู้ใช้งาน'
    };
    return (
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleStyles[user.role]}`}>
        {roleNames[user.role]}
      </span>
    );
  };

  return (
    <>
      <nav className="navbar-modern sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('calendar')}>
                <img
                  src="/logo.png"
                  alt="EduMeet"
                  className="h-10 w-auto rounded-xl shadow-lg shadow-sky-400/20 group-hover:shadow-xl group-hover:shadow-sky-400/30 transition-all duration-300"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-sky-500 via-blue-500 to-teal-500 bg-clip-text text-transparent">
                  EduMeet
                </span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex ml-10 space-x-2">
                <button
                  onClick={() => onNavigate('calendar')}
                  className={navItemClass('calendar')}
                >
                  <Calendar className="w-4 h-4" />
                  ปฏิทินการจอง
                </button>

                {(user.role === UserRole.APPROVER || user.role === UserRole.ADMIN) && (
                  <>
                    <button
                      onClick={() => onNavigate('approval')}
                      className={navItemClass('approval')}
                    >
                      <CheckSquare className="w-4 h-4" />
                      อนุมัติการจอง
                    </button>
                    <button
                      onClick={() => onNavigate('history')}
                      className={navItemClass('history')}
                    >
                      <FileText className="w-4 h-4" />
                      ประวัติทั้งหมด
                    </button>
                  </>
                )}

                {user.role === UserRole.USER && (
                  <button
                    onClick={() => onNavigate('my-bookings')}
                    className={navItemClass('my-bookings')}
                  >
                    <CheckSquare className="w-4 h-4" />
                    รายการจองของฉัน
                  </button>
                )}

                {user.role === UserRole.ADMIN && (
                  <>
                    <button
                      onClick={() => onNavigate('rooms')}
                      className={navItemClass('rooms')}
                    >
                      <Settings className="w-4 h-4" />
                      จัดการห้อง
                    </button>
                    <button
                      onClick={() => onNavigate('dashboard')}
                      className={navItemClass('dashboard')}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      แดชบอร์ด
                    </button>
                    <button
                      onClick={() => onNavigate('data-management')}
                      className={navItemClass('data-management')}
                    >
                      <Database className="w-4 h-4" />
                      จัดการข้อมูล
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold text-gray-900 text-sm">{user.full_name}</div>
                  <div className="mt-0.5">{getRoleBadge()}</div>
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                title="ออกจากระบบ"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg animate-fade-in-down">
            <div className="px-4 py-4 space-y-2">
              <button onClick={() => { onNavigate('calendar'); setMobileMenuOpen(false); }} className={mobileNavItemClass('calendar') + ' w-full'}>
                <Calendar className="w-5 h-5" />
                ปฏิทินการจอง
              </button>

              {(user.role === UserRole.APPROVER || user.role === UserRole.ADMIN) && (
                <button onClick={() => { onNavigate('approval'); setMobileMenuOpen(false); }} className={mobileNavItemClass('approval') + ' w-full'}>
                  <CheckSquare className="w-5 h-5" />
                  อนุมัติการจอง
                </button>
              )}

              {user.role === UserRole.USER && (
                <button onClick={() => { onNavigate('my-bookings'); setMobileMenuOpen(false); }} className={mobileNavItemClass('my-bookings') + ' w-full'}>
                  <CheckSquare className="w-5 h-5" />
                  รายการจองของฉัน
                </button>
              )}

              {user.role === UserRole.ADMIN && (
                <>
                  <button onClick={() => { onNavigate('rooms'); setMobileMenuOpen(false); }} className={mobileNavItemClass('rooms') + ' w-full'}>
                    <Settings className="w-5 h-5" />
                    จัดการห้อง
                  </button>
                  <button onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }} className={mobileNavItemClass('dashboard') + ' w-full'}>
                    <LayoutDashboard className="w-5 h-5" />
                    แดชบอร์ด
                  </button>
                  <button onClick={() => { onNavigate('data-management'); setMobileMenuOpen(false); }} className={mobileNavItemClass('data-management') + ' w-full'}>
                    <Database className="w-5 h-5" />
                    จัดการข้อมูล
                  </button>
                </>
              )}

              {/* Mobile user info */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-2">
                  <div className="h-12 w-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{user.full_name}</div>
                    <div className="mt-1">{getRoleBadge()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};