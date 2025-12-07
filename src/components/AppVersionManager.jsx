import { useState, useEffect } from "react";
import { BASE_API_URL } from "../config/api";

const PLATFORMS = {
  android_mobile: "Android Mobile",
  android_tv: "Android TV",
};

export default function AppVersionManager() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [filterPlatform, setFilterPlatform] = useState("");
  const [formData, setFormData] = useState({
    platform: "android_mobile",
    version_code: 1,
    version_name: "1.0.0",
    download_url: "",
    release_notes: "",
    min_required_version: 1,
    file_size: "",
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

  // Reset form
  const resetForm = () => {
    setFormData({
      platform: "android_mobile",
      version_code: 1,
      version_name: "1.0.0",
      download_url: "",
      release_notes: "",
      min_required_version: 1,
      file_size: "",
      is_active: true,
    });
    setEditingVersion(null);
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
      download_url: version.download_url,
      release_notes: version.release_notes || "",
      min_required_version: version.min_required_version,
      file_size: version.file_size || "",
      is_active: version.is_active,
    });
    setShowModal(true);
  };

  // Create or update version
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingVersion
        ? `${BASE_API_URL}/admin/app-versions/${editingVersion.id}`
        : `${BASE_API_URL}/admin/app-versions`;
      const method = editingVersion ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          version_code: parseInt(formData.version_code),
          min_required_version: parseInt(formData.min_required_version),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save version");
      }

      setShowModal(false);
      resetForm();
      fetchVersions();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete version
  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phiên bản này?")) return;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-100 p-4 text-red-700">
        Lỗi: {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Quản Lý Phiên Bản Ứng Dụng
        </h1>
        <div className="flex gap-3">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Tất cả nền tảng</option>
            <option value="android_mobile">Android Mobile</option>
            <option value="android_tv">Android TV</option>
          </select>
          <button
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            + Thêm Phiên Bản
          </button>
        </div>
      </div>

      {/* Version Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {versions.map((version) => (
          <div
            key={version.id}
            className={`rounded-lg border ${
              version.is_active
                ? "border-green-500 bg-green-50"
                : "border-gray-200 bg-white"
            } p-4 shadow-sm`}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <span
                  className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                    version.platform === "android_mobile"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {PLATFORMS[version.platform]}
                </span>
                {version.is_active && (
                  <span className="ml-2 inline-block rounded bg-green-500 px-2 py-1 text-xs font-medium text-white">
                    Đang hoạt động
                  </span>
                )}
              </div>
              <span className="text-lg font-bold text-gray-800">
                v{version.version_name}
              </span>
            </div>

            <div className="mb-3 space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Version Code:</span>{" "}
                {version.version_code}
              </p>
              <p>
                <span className="font-medium">Min Required:</span>{" "}
                {version.min_required_version}
              </p>
              {version.file_size && (
                <p>
                  <span className="font-medium">Kích thước:</span>{" "}
                  {version.file_size}
                </p>
              )}
              <p>
                <span className="font-medium">Ngày tạo:</span>{" "}
                {formatDate(version.created_at)}
              </p>
            </div>

            {version.release_notes && (
              <div className="mb-3 max-h-20 overflow-y-auto rounded bg-gray-100 p-2 text-sm text-gray-700">
                <p className="whitespace-pre-line">{version.release_notes}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <a
                href={version.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-300"
              >
                📥 Tải xuống
              </a>
              <button
                onClick={() => openEditModal(version)}
                className="rounded bg-yellow-100 px-3 py-1 text-sm text-yellow-700 transition hover:bg-yellow-200"
              >
                ✏️ Sửa
              </button>
              {!version.is_active && (
                <button
                  onClick={() => handleActivate(version.id)}
                  className="rounded bg-green-100 px-3 py-1 text-sm text-green-700 transition hover:bg-green-200"
                >
                  ✅ Kích hoạt
                </button>
              )}
              <button
                onClick={() => handleDelete(version.id)}
                className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 transition hover:bg-red-200"
              >
                🗑️ Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {versions.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          Chưa có phiên bản nào. Nhấn "Thêm Phiên Bản" để tạo mới.
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-800">
              {editingVersion ? "Chỉnh Sửa Phiên Bản" : "Thêm Phiên Bản Mới"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nền tảng
                </label>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  disabled={editingVersion}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                >
                  <option value="android_mobile">Android Mobile</option>
                  <option value="android_tv">Android TV</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
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
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Số tăng dần (1, 2, 3...)
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Version Name
                  </label>
                  <input
                    type="text"
                    name="version_name"
                    value={formData.version_name}
                    onChange={handleInputChange}
                    placeholder="1.0.0"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  URL Tải xuống (APK)
                </label>
                <input
                  type="url"
                  name="download_url"
                  value={formData.download_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/app.apk"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Min Required Version
                  </label>
                  <input
                    type="number"
                    name="min_required_version"
                    value={formData.min_required_version}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Bắt buộc cập nhật nếu version &lt; này
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Kích thước file
                  </label>
                  <input
                    type="text"
                    name="file_size"
                    value={formData.file_size}
                    onChange={handleInputChange}
                    placeholder="25 MB"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ghi chú phát hành
                </label>
                <textarea
                  name="release_notes"
                  value={formData.release_notes}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="- Tính năng mới&#10;- Sửa lỗi..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-gray-700"
                >
                  Kích hoạt (đặt làm phiên bản mới nhất)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                >
                  {editingVersion ? "Cập Nhật" : "Tạo Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
