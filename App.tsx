import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { CalendarPage } from './pages/CalendarPage';
import { ApprovalPage } from './pages/ApprovalPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { BookingHistoryPage } from './pages/BookingHistoryPage';
import { RoomManagementPage } from './pages/RoomManagementPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { User, UserRole } from './types';

// Simple "Router" component for SPA without full React Router dependency complexity in single file response
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('calendar');

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('eduMeetUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('eduMeetUser', JSON.stringify(loggedInUser));

    // Redirect based on role
    if (loggedInUser.role === UserRole.ADMIN || loggedInUser.role === UserRole.APPROVER) {
      setCurrentPage('approval');
    } else {
      setCurrentPage('calendar');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('eduMeetUser');
    setCurrentPage('login');
  };

  // Guard: If not logged in, show login
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'calendar':
        return <CalendarPage user={user} />;
      case 'my-bookings':
        return <MyBookingsPage user={user} />;
      case 'approval':
        if (user.role === UserRole.USER) return <div className="p-8 text-center text-red-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
        return <ApprovalPage user={user} />;
      case 'rooms':
        if (user.role !== UserRole.ADMIN) return <div className="p-8 text-center text-red-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
        return <RoomManagementPage />;
      case 'dashboard':
        if (user.role !== UserRole.ADMIN) return <div className="p-8 text-center text-red-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
        return <DashboardPage />;
      case 'history':
        if (user.role === UserRole.USER) return <div className="p-8 text-center text-red-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
        return <BookingHistoryPage user={user} />;
      case 'data-management':
        if (user.role !== UserRole.ADMIN) return <div className="p-8 text-center text-red-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
        return <DataManagementPage />;
      default:
        return <CalendarPage user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar
        user={user}
        onLogout={handleLogout}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
      <main>
        {renderPage()}
      </main>
    </div>
  );
}