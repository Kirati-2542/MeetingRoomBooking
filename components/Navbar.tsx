import React from 'react';
import { User, UserRole } from '../types';
import { LogOut, Calendar, CheckSquare, LayoutDashboard, Settings } from 'lucide-react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, currentPage, onNavigate }) => {
  const navItemClass = (page: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
      currentPage === page
        ? 'bg-blue-600 text-white font-medium'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-blue-700 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              EduMeet
            </span>
            <div className="hidden md:flex ml-10 space-x-2">
              <button
                onClick={() => onNavigate('calendar')}
                className={navItemClass('calendar')}
              >
                <Calendar className="w-4 h-4" />
                ปฏิทินการจอง
              </button>

              {(user.role === UserRole.APPROVER || user.role === UserRole.ADMIN) && (
                <button
                  onClick={() => onNavigate('approval')}
                  className={navItemClass('approval')}
                >
                  <CheckSquare className="w-4 h-4" />
                  อนุมัติการจอง
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
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              <div className="font-medium text-gray-900">{user.full_name}</div>
              <div className="text-xs text-gray-500 capitalize">
                {user.role === UserRole.ADMIN ? 'ผู้ดูแลระบบ' : 
                 user.role === UserRole.APPROVER ? 'ผู้อนุมัติ' : 'ผู้ใช้งาน'}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      <div className="md:hidden border-t border-gray-100 flex justify-around p-2 bg-gray-50">
         <button onClick={() => onNavigate('calendar')} className="p-2 text-gray-600">
           <Calendar className="w-6 h-6" />
         </button>
         {(user.role === UserRole.APPROVER || user.role === UserRole.ADMIN) && (
           <button onClick={() => onNavigate('approval')} className="p-2 text-gray-600">
             <CheckSquare className="w-6 h-6" />
           </button>
         )}
         {user.role === UserRole.ADMIN && (
            <>
              <button onClick={() => onNavigate('rooms')} className="p-2 text-gray-600">
                <Settings className="w-6 h-6" />
              </button>
              <button onClick={() => onNavigate('dashboard')} className="p-2 text-gray-600">
                <LayoutDashboard className="w-6 h-6" />
              </button>
            </>
         )}
      </div>
    </nav>
  );
};