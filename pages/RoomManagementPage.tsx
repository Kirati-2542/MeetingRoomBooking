import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { storage } from '../supabaseClient';
import { Room } from '../types';
import { Plus, MapPin, Users, Monitor, Pencil, Trash2, AlertTriangle, ImageIcon, X, Building, Sparkles, Upload, Loader2 } from 'lucide-react';

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

  // Image upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setUploadError(null);
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
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
  };

  const confirmDelete = async () => {
    if (roomToDelete) {
      // Delete image from storage if exists
      if (roomToDelete.image_url && roomToDelete.image_url.includes('room-images')) {
        await storage.deleteImage(roomToDelete.image_url);
      }
      await api.rooms.delete(roomToDelete.id);
      setRoomToDelete(null);
      loadRooms();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const result = await storage.uploadImage(file);

    if (result.error) {
      setUploadError(result.error);
    } else if (result.url) {
      setFormData({ ...formData, image_url: result.url });
    }

    setIsUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (formData.image_url && formData.image_url.includes('room-images')) {
      setIsUploading(true);
      await storage.deleteImage(formData.image_url);
      setIsUploading(false);
    }
    setFormData({ ...formData, image_url: '' });
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between">
            <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-sky-400 to-blue-400 rounded-xl shadow-lg">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการห้องประชุม</h1>
            <p className="text-sm text-gray-500">เพิ่ม แก้ไข และจัดการห้องประชุมในระบบ</p>
          </div>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          เพิ่มห้องประชุม
        </button>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room, idx) => (
          <div
            key={room.id}
            className="room-card bg-white shadow-lg border border-gray-100 hover-lift animate-fade-in-up group"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Room Image */}
            <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden relative">
              {room.image_url ? (
                <img src={room.image_url} alt={room.room_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <ImageIcon className="w-12 h-12" />
                  <span className="text-xs mt-2">ไม่มีรูปภาพ</span>
                </div>
              )}
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Status badge */}
              <div className="absolute top-4 left-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${room.status === 'ACTIVE'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                  : 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                  }`}>
                  {room.status === 'ACTIVE' ? 'พร้อมใช้งาน' : 'ปิดปรับปรุง'}
                </span>
              </div>

              {/* Action Buttons (Overlay) */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditClick(room); }}
                  className="p-2.5 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-indigo-600 rounded-xl shadow-lg transition-all duration-200 hover:scale-110"
                  title="แก้ไข"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(room); }}
                  className="p-2.5 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-600 rounded-xl shadow-lg transition-all duration-200 hover:scale-110"
                  title="ลบ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{room.room_name}</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-red-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-red-400" />
                  </div>
                  <span>{room.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>รองรับ <span className="font-semibold text-gray-900">{room.capacity}</span> คน</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-green-50 rounded-lg">
                    <Monitor className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="truncate">{room.equipment || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="glass-card p-16 text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Building className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">ยังไม่มีห้องประชุม</h3>
          <p className="text-gray-500 mb-6">เริ่มต้นเพิ่มห้องประชุมแรกของคุณ</p>
          <button onClick={handleOpenAddModal} className="btn-primary">
            <Plus className="w-5 h-5 inline mr-2" />
            เพิ่มห้องประชุม
          </button>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="modal-content max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingRoomId ? 'แก้ไขห้องประชุม' : 'เพิ่มห้องประชุมใหม่'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อห้อง</label>
                  <input
                    type="text"
                    required
                    value={formData.room_name}
                    onChange={e => setFormData({ ...formData, room_name: e.target.value })}
                    className="input-modern"
                    placeholder="เช่น ห้องประชุม A"
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">รูปภาพห้อง</label>

                  {formData.image_url ? (
                    <div className="relative">
                      <div className="h-40 w-full bg-gray-100 rounded-xl overflow-hidden">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={isUploading}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-50/50 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                          <p className="mt-3 text-sm text-gray-600">กำลังอัปโหลด...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="p-3 bg-indigo-100 rounded-full mb-3">
                            <Upload className="w-6 h-6 text-indigo-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">คลิกเพื่ออัปโหลดรูปภาพ</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF สูงสุด 5MB</p>
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {uploadError && (
                    <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {uploadError}
                    </div>
                  )}

                  {/* Or enter URL manually */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span>หรือใส่ URL</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      className="input-modern text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">สถานที่ / อาคาร</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="input-modern"
                    placeholder="เช่น อาคาร 1 ชั้น 2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ความจุ (คน)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">อุปกรณ์ภายในห้อง</label>
                  <input
                    type="text"
                    value={formData.equipment}
                    onChange={e => setFormData({ ...formData, equipment: e.target.value })}
                    className="input-modern"
                    placeholder="เช่น โปรเจคเตอร์, ไมโครโฟน"
                  />
                </div>

                {editingRoomId && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">สถานะ</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="input-modern"
                    >
                      <option value="ACTIVE">พร้อมใช้งาน</option>
                      <option value="MAINTENANCE">ปิดปรับปรุง</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2"
                    disabled={isUploading}
                  >
                    <Sparkles className="w-4 h-4" />
                    บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {roomToDelete && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="modal-content max-w-md w-full animate-scale-in">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">ยืนยันการลบ</h2>
                  <p className="text-sm text-gray-500">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-700">
                  คุณกำลังจะลบห้อง <span className="font-bold">"{roomToDelete.room_name}"</span> ออกจากระบบ การลบจะส่งผลกระทบต่อประวัติการจองทั้งหมด
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRoomToDelete(null)}
                  className="btn-secondary"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn-danger flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  ลบห้อง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};