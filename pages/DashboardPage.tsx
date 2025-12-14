import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Activity, Clock, Building } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const data = await api.dashboard.getStats();
            setStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">กำลังโหลดข้อมูล...</div>;
  if (!stats) return <div className="p-8">ไม่มีข้อมูล</div>;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const statusData = [
    { name: 'รออนุมัติ', value: stats.pendingCount },
    { name: 'ดำเนินการแล้ว', value: stats.totalBookings - stats.pendingCount },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">แดชบอร์ดผู้ดูแลระบบ</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
                <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
                <p className="text-sm text-gray-500">การจองทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full mr-4">
                <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
                <p className="text-sm text-gray-500">รออนุมัติ</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingCount}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
             <div className="p-3 bg-purple-100 rounded-full mr-4">
                <Building className="w-6 h-6 text-purple-600" />
            </div>
            <div>
                <p className="text-sm text-gray-500">ห้องที่เปิดใช้งาน</p>
                <p className="text-2xl font-bold text-gray-900">{stats.topRooms.length}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Rooms Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-96">
            <h2 className="text-lg font-semibold mb-4">ห้องที่ถูกจองมากที่สุด</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topRooms} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={100} style={{fontSize: '12px'}} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="จำนวนครั้ง" />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-96 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4 w-full text-left">สัดส่วนสถานะการจอง</h2>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#0088FE] rounded-full"></div>รออนุมัติ</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#00C49F] rounded-full"></div>ดำเนินการแล้ว</div>
            </div>
        </div>
      </div>
    </div>
  );
};