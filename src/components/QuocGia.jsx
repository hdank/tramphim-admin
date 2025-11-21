import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Save,
  AlertTriangle,
  Settings, // Thêm icon Settings để dùng cho card Danh sách
  Globe, // Thêm icon Globe cho card Thêm mới
} from "lucide-react";
import { BASE_API_URL } from "../config/api"; // Giả định file này tồn tại

// --- ConfirmationModal component (giữ nguyên style cũ, nhưng nên đồng bộ nếu có thể) ---
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 font-sans">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle size={24} className="text-red-500 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900">Xác nhận</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded transition-all hover:bg-gray-300 active:scale-[0.98]"
          >
            Hủy
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded transition-all hover:bg-red-700 active:scale-[0.98]"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

// --- QuocGia component (cập nhật theme) ---
const QuocGia = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // State cho form thêm mới

  const [newCountryName, setNewCountryName] = useState("");
  const [newCountryCode, setNewCountryCode] = useState(""); // State cho form chỉnh sửa inline

  const [editingCountryId, setEditingCountryId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingCode, setEditingCode] = useState(""); // State cho thông báo

  const [formMessage, setFormMessage] = useState({ type: "", text: "" }); // State cho modal xác nhận xóa

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [countryToDeleteId, setCountryToDeleteId] = useState(null);

  const fetchCountries = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/quocgia/`);
      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách quốc gia.");
      }
      const data = await response.json(); // Sắp xếp theo tên để dễ theo dõi
      const sortedData = data.sort((a, b) =>
        a.ten_quoc_gia.localeCompare(b.ten_quoc_gia)
      );
      setCountries(sortedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const handleAddCountry = async (e) => {
    e.preventDefault();
    setFormMessage({ type: "", text: "" });

    if (!newCountryName.trim() || !newCountryCode.trim()) {
      setFormMessage({
        type: "error",
        text: "Tên và mã quốc gia không được để trống.",
      });
      return;
    }

    try {
      const response = await fetch(`${BASE_API_URL}/quocgia/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ten_quoc_gia: newCountryName,
          code: newCountryCode.toUpperCase(), // Chuyển mã quốc gia sang chữ hoa
        }),
      });

      if (response.status === 409) {
        throw new Error(
          `Quốc gia với mã '${newCountryCode.toUpperCase()}' đã tồn tại.`
        );
      }
      if (!response.ok) {
        throw new Error("Lỗi khi thêm quốc gia mới.");
      }

      const newCountry = await response.json();
      setFormMessage({
        type: "success",
        text: `Đã thêm thành công quốc gia: ${newCountry.ten_quoc_gia}`,
      });
      setCountries((prevCountries) =>
        [...prevCountries, newCountry].sort((a, b) =>
          a.ten_quoc_gia.localeCompare(b.ten_quoc_gia)
        )
      );
      setNewCountryName("");
      setNewCountryCode("");
    } catch (err) {
      setFormMessage({ type: "error", text: `Lỗi: ${err.message}` });
    }
  };

  const handleUpdateCountry = async (countryId) => {
    setFormMessage({ type: "", text: "" });

    if (!editingName.trim() || !editingCode.trim()) {
      setFormMessage({
        type: "error",
        text: "Tên và mã quốc gia không được để trống.",
      });
      return;
    }

    try {
      const response = await fetch(`${BASE_API_URL}/quocgia/${countryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ten_quoc_gia: editingName,
          code: editingCode.toUpperCase(), // Chuyển mã quốc gia sang chữ hoa
        }),
      });

      if (response.status === 409) {
        throw new Error(
          `Quốc gia với mã '${editingCode.toUpperCase()}' đã tồn tại.`
        );
      }
      if (!response.ok) {
        throw new Error("Lỗi khi cập nhật quốc gia.");
      }

      const updatedCountry = await response.json();
      setFormMessage({
        type: "success",
        text: `Đã cập nhật thành công quốc gia: ${updatedCountry.ten_quoc_gia}`,
      });
      setCountries((prevCountries) =>
        prevCountries
          .map((c) => (c.id === updatedCountry.id ? updatedCountry : c))
          .sort((a, b) => a.ten_quoc_gia.localeCompare(b.ten_quoc_gia))
      );
      setEditingCountryId(null);
      setEditingName("");
      setEditingCode("");
    } catch (err) {
      setFormMessage({ type: "error", text: `Lỗi: ${err.message}` });
    }
  };

  const handleConfirmDelete = (id) => {
    setCountryToDeleteId(id);
    setShowConfirmModal(true);
  };

  const performDelete = async () => {
    setShowConfirmModal(false);
    try {
      const response = await fetch(
        `${BASE_API_URL}/quocgia/${countryToDeleteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Lỗi khi xóa quốc gia.");
      }

      setFormMessage({
        type: "success",
        text: "Đã xóa quốc gia thành công.",
      });
      setCountries((prevCountries) =>
        prevCountries.filter((country) => country.id !== countryToDeleteId)
      );
      setCountryToDeleteId(null);
    } catch (err) {
      setFormMessage({ type: "error", text: `Lỗi: ${err.message}` });
    }
  };

  const handleEditClick = (country) => {
    setEditingCountryId(country.id);
    setEditingName(country.ten_quoc_gia);
    setEditingCode(country.code);
    setFormMessage({ type: "", text: "" });
  };

  const handleCancelEdit = () => {
    setEditingCountryId(null);
    setEditingName("");
    setEditingCode("");
    setFormMessage({ type: "", text: "" });
  };

  return (
    // Cập nhật style container và nền
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 font-sans mt-16 lg:mt-0">
      <div className="max-w-7xl mx-auto">
        {/* Header mới */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-1">
            Quản lý Quốc gia
          </h1>

          <p className="text-sm text-gray-500">
            Thêm, sửa, xóa tên và mã code của các quốc gia.
          </p>
        </div>
        {/* --- Card Thêm Quốc gia Mới --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* Header Card */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-600" />
            </div>

            <h2 className="text-lg font-medium text-gray-900">
              Thêm Quốc gia Mới
            </h2>
          </div>

          <form onSubmit={handleAddCountry} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label
                  htmlFor="countryName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tên Quốc gia:
                </label>

                <input
                  id="countryName"
                  type="text"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)} // Style Input mới
                  className="w-full px-4 py-2.5 text-black bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
                  placeholder="Ví dụ: Việt Nam"
                />
              </div>

              <div className="sm:w-36">
                <label
                  htmlFor="countryCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Slug
                </label>

                <input
                  id="countryCode"
                  type="text"
                  value={newCountryCode}
                  onChange={(e) => setNewCountryCode(e.target.value)} // Thêm toUpperCase // Style Input mới
                  className="w-full px-4 py-2.5 text-black bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all text-center "
                  placeholder="viet-nam"
                  maxLength={3}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              {/* Style Button mới */}
              <button
                type="submit"
                className="w-full sm:w-auto flex-shrink-0 flex justify-center items-center gap-1.5 px-5 py-2.5 font-medium text-sm rounded transition-all shadow-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                disabled={!newCountryName.trim() || !newCountryCode.trim()}
              >
                <Plus size={18} /> Thêm Quốc gia
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
        {/* --- Card Danh sách Quốc gia --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Header Card */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Settings className="w-4 h-4 text-blue-600" />
            </div>

            <h2 className="text-lg font-medium text-gray-900">
              Danh sách Quốc gia ({countries.length})
            </h2>
          </div>
          {/* LOADING STATE */}
          {loading && (
            <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 border-4 border-blue-600 border-dotted rounded-full animate-spin mx-auto mb-2"></div>

              <p className="text-sm font-semibold text-gray-700 ml-4">
                Đang tải quốc gia...
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
          {/* DANH SÁCH QUỐC GIA */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {countries.map((country) => (
                <div
                  key={country.id} // Style list item đồng bộ
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded transition-colors duration-200 hover:bg-gray-100 border border-gray-100 hover:border-blue-200"
                >
                  {editingCountryId === country.id ? (
                    // Chế độ chỉnh sửa
                    <div className="flex-1 space-y-2 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row items-start sm:items-center w-full">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)} // Style Input mới
                        className="flex-1 px-3 py-1.5 text-black bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all min-w-0"
                        placeholder="Tên quốc gia"
                      />

                      <input
                        type="text"
                        value={editingCode}
                        onChange={(e) =>
                          setEditingCode(e.target.value.toUpperCase())
                        }
                        className="w-16 px-3 py-1.5 text-black bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all text-center uppercase"
                        placeholder="Mã"
                        maxLength={3}
                      />

                      <div className="flex space-x-2 mt-2 sm:mt-0 flex-shrink-0">
                        {/* Nút Save mới */}

                        <button
                          onClick={() => handleUpdateCountry(country.id)}
                          className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-full transition-all shadow-sm active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                          title="Lưu"
                          disabled={!editingName.trim() || !editingCode.trim()}
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
                    // Hiển thị thông tin
                    <>
                      <div className="flex-1 min-w-0 pr-4 mb-2 sm:mb-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {country.ten_quoc_gia}
                        </div>

                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {country.code}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditClick(country)} // Style nút edit đồng bộ
                          className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-full transition-colors shadow-sm active:scale-[0.95] bg-white border border-gray-200"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleConfirmDelete(country.id)} // Style nút delete đồng bộ
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

      {showConfirmModal && (
        <ConfirmationModal
          message="Bạn có chắc chắn muốn xóa quốc gia này? Hành động này không thể hoàn tác."
          onConfirm={performDelete}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default QuocGia;
