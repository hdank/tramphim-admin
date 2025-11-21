import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Save,
  Settings, // Thêm Settings để dùng làm icon cho card Danh sách
} from "lucide-react";
import { BASE_API_URL } from "../config/api";

const The_Loai = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // State cho việc thêm mới

  const [newGenreName, setNewGenreName] = useState("");
  const [newGenreSlug, setNewGenreSlug] = useState(""); // State cho việc chỉnh sửa inline

  const [editingGenreId, setEditingGenreId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingSlug, setEditingSlug] = useState("");

  const [formMessage, setFormMessage] = useState({ type: "", text: "" });

  const fetchGenres = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/theloai/`);
      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách thể loại.");
      }
      const data = await response.json();
      setGenres(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const handleAddGenre = async (e) => {
    e.preventDefault();
    setFormMessage({ type: "", text: "" });

    if (!newGenreName.trim() || !newGenreSlug.trim()) {
      setFormMessage({
        type: "error",
        text: "Tên và slug không được để trống.",
      });
      return;
    }

    try {
      const response = await fetch(`${BASE_API_URL}/theloai/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ten: newGenreName, slug: newGenreSlug }),
      });

      if (response.status === 409) {
        throw new Error(`Thể loại với slug '${newGenreSlug}' đã tồn tại.`);
      }
      if (!response.ok) {
        throw new Error("Lỗi khi thêm thể loại mới.");
      }

      const newGenre = await response.json();
      setFormMessage({
        type: "success",
        text: `Đã thêm thành công thể loại: ${newGenre.ten}`,
      });
      setGenres((prevGenres) => [...prevGenres, newGenre]);
      setNewGenreName("");
      setNewGenreSlug("");
    } catch (err) {
      setFormMessage({ type: "error", text: `Lỗi: ${err.message}` });
    }
  };

  const handleUpdateGenre = async (id) => {
    setFormMessage({ type: "", text: "" });

    if (!editingName.trim() || !editingSlug.trim()) {
      setFormMessage({
        type: "error",
        text: "Tên và slug không được để trống.",
      });
      return;
    }

    try {
      const response = await fetch(`${BASE_API_URL}/theloai/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ten: editingName, slug: editingSlug }),
      });

      if (response.status === 409) {
        throw new Error(`Thể loại với slug '${editingSlug}' đã tồn tại.`);
      }
      if (!response.ok) {
        throw new Error("Lỗi khi cập nhật thể loại.");
      }

      const updatedGenre = await response.json();
      setFormMessage({
        type: "success",
        text: `Đã cập nhật thành công thể loại: ${updatedGenre.ten}`,
      });

      setGenres((prevGenres) =>
        prevGenres.map((g) => (g.id === updatedGenre.id ? updatedGenre : g))
      );

      setEditingGenreId(null);
      setEditingName("");
      setEditingSlug("");
    } catch (err) {
      setFormMessage({ type: "error", text: `Lỗi: ${err.message}` });
    }
  };

  const handleDeleteGenre = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thể loại này?")) {
      return;
    }
    try {
      const response = await fetch(`${BASE_API_URL}/theloai/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Lỗi khi xóa thể loại.");
      }

      setFormMessage({
        type: "success",
        text: "Đã xóa thể loại thành công.",
      });
      setGenres((prevGenres) => prevGenres.filter((genre) => genre.id !== id));
    } catch (err) {
      setFormMessage({ type: "error", text: `Lỗi: ${err.message}` });
    }
  };

  const handleEditClick = (genre) => {
    setEditingGenreId(genre.id);
    setEditingName(genre.ten);
    setEditingSlug(genre.slug);
    setFormMessage({ type: "", text: "" });
  };

  const handleCancelEdit = () => {
    setEditingGenreId(null);
    setEditingName("");
    setEditingSlug("");
    setFormMessage({ type: "", text: "" });
  };

  return (
    // Cập nhật style container và nền
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header mới */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-1">
            Quản lý Thể loại
          </h1>
          <p className="text-sm text-gray-500">
            Thêm, sửa, xóa tên và slug của các thể loại phim.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* Header Card */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Plus className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">
              Thêm Thể loại Mới
            </h2>
          </div>
          <form onSubmit={handleAddGenre} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label
                  htmlFor="newGenreName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tên Thể loại:
                </label>
                <input
                  id="newGenreName"
                  type="text"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)} // Style Input mới
                  className="w-full px-4 py-2.5 text-black bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
                  placeholder="Ví dụ: Hành Động"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="newGenreSlug"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Slug:
                </label>
                <input
                  id="newGenreSlug"
                  type="text"
                  value={newGenreSlug}
                  onChange={(e) => setNewGenreSlug(e.target.value)} // Style Input mới
                  className="w-full px-4 py-2.5 text-black bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
                  placeholder="Ví dụ: hanh-dong"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto flex-shrink-0 flex justify-center items-center gap-1.5 px-5 py-2.5 font-medium text-sm rounded transition-all shadow-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
              >
                <Plus size={18} /> Thêm Thể loại
              </button>
            </div>
          </form>
          {formMessage.text && (
            <div
              className={`mt-4 p-3 rounded-lg flex items-center gap-3 text-sm ${
                formMessage.type === "error"
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-green-100 text-green-700 border border-green-200"
              }`}
            >
              {formMessage.type === "error" ? (
                <AlertCircle size={18} className="flex-shrink-0" />
              ) : (
                <CheckCircle size={18} className="flex-shrink-0" />
              )}
              <span className="font-medium">{formMessage.text}</span>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Settings className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">
              Danh sách Thể loại ({genres.length})
            </h2>
          </div>
          {/* LOADING STATE */}
          {loading && (
            <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 border-4 border-blue-600 border-dotted rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm font-semibold text-gray-700 ml-4">
                Đang tải thể loại...
              </p>
            </div>
          )}
          {/* ERROR STATE */}
          {error && (
            <div className="p-4 bg-red-100 text-red-700 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle size={20} className="flex-shrink-0" />
              <span className="text-sm font-medium">Lỗi: {error}</span>
            </div>
          )}
          {/* DANH SÁCH CẤU HÌNH */}
          {!loading && !error && (
            <div className="grid grid-cols-2 gap-3">
              {genres.map((genre) => (
                <div
                  key={genre.id} // Style list item đồng bộ với Banner.jsx
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded transition-colors duration-200 hover:bg-gray-100 border border-gray-100 hover:border-blue-200"
                >
                  {editingGenreId === genre.id ? (
                    // Chế độ chỉnh sửa
                    <div className="flex-1 space-y-2 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row items-start sm:items-center w-full">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)} // Style Input mới
                        className="w-full sm:w-1/2 px-3 py-1.5 text-black bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all"
                      />
                      <input
                        type="text"
                        value={editingSlug}
                        onChange={(e) => setEditingSlug(e.target.value)} // Style Input mới
                        className="w-full sm:w-1/2 px-3 py-1.5 text-black bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all"
                      />
                      <div className="flex space-x-2 mt-2 sm:mt-0 flex-shrink-0">
                        {/* Nút Save mới */}
                        <button
                          onClick={() => handleUpdateGenre(genre.id)}
                          className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-full transition-all shadow-sm active:scale-[0.95]"
                          title="Lưu"
                        >
                          <Save size={16} />
                        </button>
                        {/* Nút Cancel mới */}
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-full transition-all shadow-sm active:scale-[0.95]"
                          title="Hủy"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Chế độ hiển thị bình thường
                    <>
                      {/* Nội dung tên/slug */}
                      <div className="flex-1 min-w-0 pr-4 mb-2 sm:mb-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {genre.ten}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {genre.slug}
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditClick(genre)}
                          className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-full transition-colors shadow-sm active:scale-[0.95] bg-white border border-gray-200"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteGenre(genre.id)}
                          className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-full transition-colors shadow-sm active:scale-[0.95] bg-white border border-gray-200"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default The_Loai;
