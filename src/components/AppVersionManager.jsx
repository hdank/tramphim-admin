import { useState, useEffect, useRef } from "react";
import { BASE_API_URL } from "../config/api";

const PLATFORMS = {
  android_mobile: { name: "Android Mobile", icon: "📱", color: "blue" },
  android_tv: { name: "Android TV", icon: "📺", color: "purple" },
};

export default function AppVersionManager() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [filterPlatform, setFilterPlatform] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [formData, setFormData] = useState({
    platform: "android_mobile",
    version_code: 1,
    version_name: "1.0.0",
    release_notes: "",
    min_required_version: 1,
    is_active: true,
  });

  // Fetch all versions
  const fetchVersions = async () => {
    try {
      setLoading(true);
      const url = filterPlatform
        ? `${BASE_API_URL}/admin/app-versions?platform=${filterPlatform}`
        : `${BASE_API_URL}/admin/app-versions`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch versions");
      const data = await response.json();
      setVersions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [filterPlatform]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.apk')) {
        alert('Vui lòng chọn file APK (.apk)');
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        alert('File quá lớn. Kích thước tối đa là 200MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      platform: "android_mobile",
      version_code: 1,
      version_name: "1.0.0",
      release_notes: "",
      min_required_version: 1,
      is_active: true,
    });
    setEditingVersion(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open modal for creating new version
  const openCreateModal = () => {
    resetForm();
    // Set version_code to next available
    const maxVersionCode = versions
      .filter((v) => v.platform === formData.platform)
      .reduce((max, v) => Math.max(max, v.version_code), 0);
    setFormData((prev) => ({
      ...prev,
      version_code: maxVersionCode + 1,
    }));
    setShowModal(true);
  };

  // Open modal for editing
  const openEditModal = (version) => {
    setEditingVersion(version);
    setFormData({
      platform: version.platform,
      version_code: version.version_code,
      version_name: version.version_name,
      release_notes: version.release_notes || "",
      min_required_version: version.min_required_version,
      is_active: version.is_active,
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  // Create new version with APK upload
  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Vui lòng chọn file APK để upload');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      formDataToSend.append('platform', formData.platform);
      formDataToSend.append('version_code', formData.version_code);
      formDataToSend.append('version_name', formData.version_name);
      formDataToSend.append('release_notes', formData.release_notes || '');
      formDataToSend.append('min_required_version', formData.min_required_version);
      formDataToSend.append('is_active', formData.is_active);
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setShowModal(false);
          resetForm();
          fetchVersions();
          alert('Upload APK thành công!');
        } else {
          const error = JSON.parse(xhr.responseText);
          alert(error.detail || 'Upload thất bại');
        }
        setUploading(false);
      });
      
      xhr.addEventListener('error', () => {
        alert('Lỗi kết nối khi upload');
        setUploading(false);
      });
      
      xhr.open('POST', `${BASE_API_URL}/admin/app-versions/upload-apk`);
      xhr.send(formDataToSend);
      
    } catch (err) {
      alert(err.message);
      setUploading(false);
    }
  };

  // Update existing version (metadata only or with new APK)
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      // Update metadata first
      const response = await fetch(`${BASE_API_URL}/admin/app-versions/${editingVersion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version_name: formData.version_name,
          release_notes: formData.release_notes,
          min_required_version: parseInt(formData.min_required_version),
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update version");
      }
      
      // If new file selected, upload it
      if (selectedFile) {
        setUploading(true);
        setUploadProgress(0);
        
        const formDataToSend = new FormData();
        formDataToSend.append('file', selectedFile);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        xhr.addEventListener('load', () => {
          setUploading(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            setShowModal(false);
            resetForm();
            fetchVersions();
            alert('Cập nhật thành công!');
          } else {
            const error = JSON.parse(xhr.responseText);
            alert(error.detail || 'Upload APK thất bại');
            fetchVersions();
          }
        });
        
        xhr.addEventListener('error', () => {
          alert('Lỗi kết nối khi upload APK');
          setUploading(false);
        });
        
        xhr.open('POST', `${BASE_API_URL}/admin/app-versions/${editingVersion.id}/upload-apk`);
        xhr.send(formDataToSend);
      } else {
        setShowModal(false);
        resetForm();
        fetchVersions();
      }
      
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = (e) => {
    if (editingVersion) {
      handleUpdate(e);
    } else {
      handleCreate(e);
    }
  };

  // Delete version
  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phiên bản này?\nFile APK cũng sẽ bị xóa.")) return;

    try {
      const response = await fetch(`${BASE_API_URL}/admin/app-versions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete version");
      fetchVersions();
    } catch (err) {
      alert(err.message);
    }
  };

  // Activate version
  const handleActivate = async (id) => {
    try {
      const response = await fetch(
        `${BASE_API_URL}/admin/app-versions/${id}/activate`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Failed to activate version");
      fetchVersions();
    } catch (err) {
      alert(err.message);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  // Group versions by platform
  const groupedVersions = versions.reduce((acc, version) => {
    if (!acc[version.platform]) {
      acc[version.platform] = [];
    }
    acc[version.platform].push(version);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <span className="text-gray-400">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl bg-red-500/10 p-6 text-center">
        <div className="mb-2 text-4xl">⚠️</div>
        <p className="text-red-400">Lỗi: {error}</p>
        <button
          onClick={fetchVersions}
          className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              📱 Quản Lý Phiên Bản Ứng Dụng
            </h1>
            <p className="mt-1 text-gray-400">
              Upload và quản lý các file APK cho Android Mobile và Android TV
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 font-semibold text-white shadow-lg shadow-green-500/25 transition hover:from-green-600 hover:to-green-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload APK Mới
          </button>
        </div>

        {/* Filter */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setFilterPlatform("")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filterPlatform === ""
                ? "bg-white text-gray-900"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterPlatform("android_mobile")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              filterPlatform === "android_mobile"
                ? "bg-blue-500 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            📱 Mobile
          </button>
          <button
            onClick={() => setFilterPlatform("android_tv")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              filterPlatform === "android_tv"
                ? "bg-purple-500 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            📺 TV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/20 p-3">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{versions.length}</p>
              <p className="text-sm text-gray-400">Tổng phiên bản</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/20 p-3">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {versions.filter((v) => v.is_active).length}
              </p>
              <p className="text-sm text-gray-400">Đang hoạt động</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/20 p-3">
              <span className="text-2xl">📱</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {versions.filter((v) => v.platform === "android_mobile").length}
              </p>
              <p className="text-sm text-gray-400">Mobile</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/20 p-3">
              <span className="text-2xl">📺</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {versions.filter((v) => v.platform === "android_tv").length}
              </p>
              <p className="text-sm text-gray-400">TV</p>
            </div>
          </div>
        </div>
      </div>

      {/* Version List by Platform */}
      {Object.entries(groupedVersions).length === 0 ? (
        <div className="rounded-xl bg-gray-800 py-16 text-center">
          <div className="mb-4 text-6xl">📭</div>
          <h3 className="mb-2 text-xl font-semibold text-white">Chưa có phiên bản nào</h3>
          <p className="text-gray-400">Nhấn "Upload APK Mới" để bắt đầu</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedVersions).map(([platform, platformVersions]) => (
            <div key={platform} className="rounded-xl bg-gray-800 overflow-hidden">
              {/* Platform Header */}
              <div className={`px-6 py-4 ${
                platform === "android_mobile" 
                  ? "bg-gradient-to-r from-blue-600 to-blue-500" 
                  : "bg-gradient-to-r from-purple-600 to-purple-500"
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{PLATFORMS[platform]?.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {PLATFORMS[platform]?.name}
                    </h2>
                    <p className="text-sm text-white/70">
                      {platformVersions.length} phiên bản
                    </p>
                  </div>
                </div>
              </div>

              {/* Version Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
                      <th className="px-6 py-4 font-medium">Phiên bản</th>
                      <th className="px-6 py-4 font-medium">Version Code</th>
                      <th className="px-6 py-4 font-medium">Min Required</th>
                      <th className="px-6 py-4 font-medium">Kích thước</th>
                      <th className="px-6 py-4 font-medium">Trạng thái</th>
                      <th className="px-6 py-4 font-medium">Ngày tạo</th>
                      <th className="px-6 py-4 font-medium text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformVersions.map((version, idx) => (
                      <tr
                        key={version.id}
                        className={`border-b border-gray-700/50 transition hover:bg-gray-700/30 ${
                          version.is_active ? "bg-green-500/5" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white ${
                              platform === "android_mobile" ? "bg-blue-500" : "bg-purple-500"
                            }`}>
                              {version.version_name.split(".")[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-white">v{version.version_name}</p>
                              {version.release_notes && (
                                <p className="max-w-xs truncate text-xs text-gray-500">
                                  {version.release_notes.split("\n")[0]}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded bg-gray-700 px-2 py-1 font-mono text-sm text-gray-300">
                            {version.version_code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded bg-orange-500/20 px-2 py-1 font-mono text-sm text-orange-400">
                            ≥ {version.min_required_version}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {version.file_size || "—"}
                        </td>
                        <td className="px-6 py-4">
                          {version.is_active ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-400">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-600/50 px-3 py-1 text-sm text-gray-400">
                              <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                              Không hoạt động
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {formatDate(version.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={version.download_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-gray-700 p-2 text-gray-300 transition hover:bg-green-500 hover:text-white"
                              title="Tải xuống APK"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                            <button
                              onClick={() => openEditModal(version)}
                              className="rounded-lg bg-gray-700 p-2 text-gray-300 transition hover:bg-yellow-500 hover:text-white"
                              title="Chỉnh sửa"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {!version.is_active && (
                              <button
                                onClick={() => handleActivate(version.id)}
                                className="rounded-lg bg-gray-700 p-2 text-gray-300 transition hover:bg-green-500 hover:text-white"
                                title="Kích hoạt"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(version.id)}
                              className="rounded-lg bg-gray-700 p-2 text-gray-300 transition hover:bg-red-500 hover:text-white"
                              title="Xóa"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-gray-800 shadow-2xl">
            {/* Modal Header */}
            <div className={`px-6 py-4 ${
              formData.platform === "android_mobile"
                ? "bg-gradient-to-r from-blue-600 to-blue-500"
                : "bg-gradient-to-r from-purple-600 to-purple-500"
            }`}>
              <h2 className="text-xl font-bold text-white">
                {editingVersion ? "✏️ Chỉnh Sửa Phiên Bản" : "📤 Upload APK Mới"}
              </h2>
              <p className="text-sm text-white/70">
                {editingVersion 
                  ? `Đang chỉnh sửa v${editingVersion.version_name}`
                  : "Upload file APK và điền thông tin phiên bản"
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Platform Select */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Nền tảng
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => !editingVersion && setFormData(prev => ({ ...prev, platform: "android_mobile" }))}
                    disabled={editingVersion}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition ${
                      formData.platform === "android_mobile"
                        ? "border-blue-500 bg-blue-500/20 text-white"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    } ${editingVersion ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <span className="text-2xl">📱</span>
                    <span className="font-medium">Mobile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => !editingVersion && setFormData(prev => ({ ...prev, platform: "android_tv" }))}
                    disabled={editingVersion}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition ${
                      formData.platform === "android_tv"
                        ? "border-purple-500 bg-purple-500/20 text-white"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    } ${editingVersion ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <span className="text-2xl">📺</span>
                    <span className="font-medium">TV</span>
                  </button>
                </div>
              </div>

              {/* APK File Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  File APK {!editingVersion && <span className="text-red-400">*</span>}
                </label>
                <div 
                  className={`relative rounded-xl border-2 border-dashed p-6 text-center transition ${
                    selectedFile 
                      ? "border-green-500 bg-green-500/10" 
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".apk"
                    onChange={handleFileSelect}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="rounded-lg bg-green-500/20 p-3">
                        <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">{selectedFile.name}</p>
                        <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="ml-2 rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-400">
                        <span className="font-medium text-white">Nhấn để chọn</span> hoặc kéo thả file APK
                      </p>
                      <p className="text-xs text-gray-500">Tối đa 200MB</p>
                    </>
                  )}
                </div>
                {editingVersion && (
                  <p className="mt-2 text-xs text-gray-500">
                    💡 Bỏ trống nếu không muốn thay đổi file APK
                  </p>
                )}
              </div>

              {/* Version Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Version Code
                  </label>
                  <input
                    type="number"
                    name="version_code"
                    value={formData.version_code}
                    onChange={handleInputChange}
                    disabled={editingVersion}
                    min="1"
                    required
                    className="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Số nguyên tăng dần</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Version Name
                  </label>
                  <input
                    type="text"
                    name="version_name"
                    value={formData.version_name}
                    onChange={handleInputChange}
                    placeholder="1.0.0"
                    required
                    className="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Ví dụ: 1.0.0, 2.1.0</p>
                </div>
              </div>

              {/* Min Required Version */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Min Required Version
                </label>
                <input
                  type="number"
                  name="min_required_version"
                  value={formData.min_required_version}
                  onChange={handleInputChange}
                  min="1"
                  required
                  className="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Người dùng có version code thấp hơn sẽ bị bắt buộc cập nhật</p>
              </div>

              {/* Release Notes */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Ghi chú phát hành
                </label>
                <textarea
                  name="release_notes"
                  value={formData.release_notes}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="- Tính năng mới&#10;- Sửa lỗi..."
                  className="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-gray-700/50 p-4">
                <div>
                  <p className="font-medium text-white">Kích hoạt phiên bản</p>
                  <p className="text-sm text-gray-400">Đặt làm phiên bản mới nhất cho nền tảng này</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="peer sr-only"
                  />
                  <div className="h-7 w-14 rounded-full bg-gray-600 after:absolute after:left-1 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-7"></div>
                </label>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="rounded-xl bg-gray-700/50 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-300">Đang upload...</span>
                    <span className="font-medium text-white">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-600">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={uploading}
                  className="flex-1 rounded-xl border border-gray-600 px-6 py-3 font-medium text-gray-300 transition hover:bg-gray-700 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading || (!editingVersion && !selectedFile)}
                  className={`flex-1 rounded-xl px-6 py-3 font-semibold text-white transition disabled:opacity-50 ${
                    formData.platform === "android_mobile"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-purple-500 hover:bg-purple-600"
                  }`}
                >
                  {uploading ? "Đang upload..." : editingVersion ? "Cập Nhật" : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
