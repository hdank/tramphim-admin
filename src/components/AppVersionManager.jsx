import React, { useState, useEffect } from 'react';
import { BASE_API_URL } from '../config/api.js';

export default function AppVersionManager() {
  const [versions, setVersions] = useState({ mobile: null, tv: null });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    platform: 'mobile',
    version: '',
    releaseNotes: '',
    file: null
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/app-version/all`);
      const data = await response.json();
      setVersions(data);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.apk')) {
      setUploadForm({ ...uploadForm, file });
    } else {
      setMessage({ type: 'error', text: 'Vui lòng chọn file APK' });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.version) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('platform', uploadForm.platform);
    formData.append('version', uploadForm.version);
    formData.append('release_notes', uploadForm.releaseNotes);
    formData.append('apk_file', uploadForm.file);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${BASE_API_URL}/app-version/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload thất bại');
      }
      
      setMessage({ type: 'success', text: 'Upload thành công!' });
      setUploadForm({ platform: 'mobile', version: '', releaseNotes: '', file: null });
      fetchVersions();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Upload thất bại' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (platform) => {
    if (!confirm(`Bạn có chắc muốn xóa bản ${platform}?`)) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${BASE_API_URL}/app-version/${platform}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Xóa thất bại');
      }
      
      setMessage({ type: 'success', text: 'Đã xóa thành công' });
      fetchVersions();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Xóa thất bại' 
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-white">Quản Lý Ứng Dụng APK</h1>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Current Versions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Mobile Version */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-sky-500/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                <path d="M12 18h.01"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Mobile APK</h2>
          </div>
          
          {versions.mobile ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Phiên bản:</span>
                <span className="text-white font-medium">{versions.mobile.version}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Kích thước:</span>
                <span className="text-white">{formatFileSize(versions.mobile.file_size)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ngày upload:</span>
                <span className="text-white">{formatDate(versions.mobile.uploaded_at)}</span>
              </div>
              {versions.mobile.release_notes && (
                <div className="text-sm">
                  <span className="text-gray-400">Ghi chú:</span>
                  <p className="text-white mt-1">{versions.mobile.release_notes}</p>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <a 
                  href={versions.mobile.download_url}
                  className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg text-center hover:bg-sky-600 transition"
                >
                  Tải xuống
                </a>
                <button 
                  onClick={() => handleDelete('mobile')}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Chưa có bản APK nào</p>
          )}
        </div>

        {/* TV Version */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <rect width="20" height="15" x="2" y="3" rx="2"/>
                <polyline points="8 21 12 17 16 21"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Android TV APK</h2>
          </div>
          
          {versions.tv ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Phiên bản:</span>
                <span className="text-white font-medium">{versions.tv.version}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Kích thước:</span>
                <span className="text-white">{formatFileSize(versions.tv.file_size)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ngày upload:</span>
                <span className="text-white">{formatDate(versions.tv.uploaded_at)}</span>
              </div>
              {versions.tv.release_notes && (
                <div className="text-sm">
                  <span className="text-gray-400">Ghi chú:</span>
                  <p className="text-white mt-1">{versions.tv.release_notes}</p>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <a 
                  href={versions.tv.download_url}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg text-center hover:bg-purple-600 transition"
                >
                  Tải xuống
                </a>
                <button 
                  onClick={() => handleDelete('tv')}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Chưa có bản APK nào</p>
          )}
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">Upload APK Mới</h2>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nền tảng
              </label>
              <select
                value={uploadForm.platform}
                onChange={(e) => setUploadForm({ ...uploadForm, platform: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="mobile">Mobile (Điện thoại)</option>
                <option value="tv">Android TV</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Phiên bản
              </label>
              <input
                type="text"
                placeholder="VD: 1.0.0"
                value={uploadForm.version}
                onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Ghi chú phát hành (tùy chọn)
            </label>
            <textarea
              placeholder="Mô tả các thay đổi trong phiên bản này..."
              value={uploadForm.releaseNotes}
              onChange={(e) => setUploadForm({ ...uploadForm, releaseNotes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              File APK
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-sky-500 transition cursor-pointer">
              <input
                type="file"
                accept=".apk"
                onChange={handleFileChange}
                className="hidden"
                id="apk-upload"
              />
              <label htmlFor="apk-upload" className="cursor-pointer">
                {uploadForm.file ? (
                  <div className="text-sky-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">{uploadForm.file.name}</p>
                    <p className="text-sm text-gray-400">{formatFileSize(uploadForm.file.size)}</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p>Nhấn để chọn file APK</p>
                    <p className="text-sm">hoặc kéo thả file vào đây</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Đang upload...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload APK
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
