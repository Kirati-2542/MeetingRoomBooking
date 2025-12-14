import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Room } from '../types';
import { Plus, MapPin, Users, Monitor, Pencil, Trash2, AlertTriangle, ImageIcon } from 'lucide-react';

export const RoomManagementPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    room_name: '',
    location: '',
    capacity: 10,
    equipment: '',
    image_url: '',
    status: 'ACTIVE' as 'ACTIVE' | 'MAINTENANCE'
  });

  // Delete Confirmation State
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    const data = await api.rooms.list();
    setRooms(data);
    setLoading(false);
  };

  const handleOpenAddModal = () => {
    setEditingRoomId(null);
    setFormData({ room_name: '', location: '', capacity: 10, equipment: '', image_url: '', status: 'ACTIVE' });
    setIsModalOpen(true);
  };

  const handleEditClick = (room: Room) => {
    setEditingRoomId(room.id);
    setFormData({
      room_name: room.room_name,
      location: room.location,
      capacity: room.capacity,
      equipment: room.equipment,
      image_url: room.image_url || '',
      status: room.status
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
  };

  const confirmDelete = async () => {
    if (roomToDelete) {
        await api.rooms.delete(roomToDelete.id);
        setRoomToDelete(null);
        loadRooms();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoomId) {
      await api.rooms.update({
        id: editingRoomId,
        ...formData
      });
    } else {
      await api.rooms.create(formData);
    }
    setIsModalOpen(false);
    loadRooms();
  };

  if (loading) return <div className="p-8">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการห้องประชุม</h1>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          เพิ่มห้องประชุม
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative group">
            
            {/* Room Image */}
            <div className="h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden relative">
               {room.image_url ? (
                   <img src={room.image_url} alt={room.room_name} className="w-full h-full object-cover" />
               ) : (
                   <ImageIcon className="w-12 h-12 text-gray-300" />
               )}
               <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity"></div>
            </div>

            {/* Action Buttons (Overlay) */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEditClick(room)}
                className="p-2 bg-white text-gray-600 hover:text-blue-600 rounded-full shadow-md transition-colors"
                title="แก้ไข"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDeleteClick(room)}
                className="p-2 bg-white text-gray-600 hover:text-red-600 rounded-full shadow-md transition-colors"
                title="ลบ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{room.room_name}</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{room.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>รองรับ {room.capacity} คน</span>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-gray-400" />
                  <span>{room.equipment || '-'}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    room.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {room.status === 'ACTIVE' ? 'พร้อมใช้งาน' : 'ปิดปรับปรุง'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingRoomId ? 'แก้ไขห้องประชุม' : 'เพิ่มห้องประชุมใหม่'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อห้อง</label>
                <input
                  type="text"
                  required
                  value={formData.room_name}
                  onChange={e => setFormData({...formData, room_name: e.target.value})}
                  className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="เช่น ห้องประชุม A"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL รูปภาพ</label>
                <div className="flex gap-2">
                   <input
                    type="url"
                    value={formData.image_url}
                    onChange={e => setFormData({...formData, image_url: e.target.value})}
                    className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                {formData.image_url && (
                    <div className="mt-2 h-32 w-full bg-gray-100 rounded-md overflow-hidden">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่ / อาคาร</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="เช่น อาคาร 1 ชั้น 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ความจุ (คน)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อุปกรณ์ภายในห้อง</label>
                <input
                  type="text"
                  value={formData.equipment}
                  onChange={e => setFormData({...formData, equipment: e.target.value})}
                  className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="เช่น โปรเจคเตอร์, ไมโครโฟน"
                />
              </div>
              {editingRoomId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">พร้อมใช้งาน</option>
                    <option value="MAINTENANCE">ปิดปรับปรุง</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {roomToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
             <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">ยืนยันการลบ</h2>
            </div>
            
            <p className="text-gray-600 mb-6 text-sm">
                คุณแน่ใจหรือไม่ว่าต้องการลบห้อง <span className="font-semibold text-gray-900">"{roomToDelete.room_name}"</span>? 
                การกระทำนี้ไม่สามารถย้อนกลับได้และอาจส่งผลกระทบต่อประวัติการจอง
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRoomToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                ลบห้อง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};