// src/components/CrawlModal.jsx
import React, { useState } from "react";
import axios from "axios";
import {
  X,
  PlayCircle,
  Loader2,
  Film,
  Tv,
  Zap,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "react-toastify";
import { BASE_API_URL } from "../config/api";

const CrawlModal = ({ onClose, onCrawlSuccess }) => {
  const [formData, setFormData] = useState({
    start_page: 1,
    end_page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [manualSlug, setManualSlug] = useState("");
  const [manualTmdbId, setManualTmdbId] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  const handleCrawl = async (e, type) => {
    e.preventDefault();
    setLoading(type);
    setError(null);

    // Sử dụng BASE_API_URL để xây dựng apiUrl
    const apiUrl = `${BASE_API_URL}/import/${type}/`;

    try {
      await axios.post(apiUrl, formData);
      toast.success(`Đã crawl ${type} thành công.`);
      onCrawlSuccess();
      onClose();
    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu crawl:", err);
      let errorMessage = "Lỗi mạng: Không thể kết nối đến máy chủ.";
      if (err.response) {
        errorMessage = `Lỗi: ${
          err.response.data.detail || "Có lỗi xảy ra từ server."
        }`;
      }
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const crawlOptions = [
    {
      type: "phim-bo",
      label: "Phim Bộ",
      icon: Tv,
      description: "Thu thập dữ liệu phim bộ TV series",
      gradient: "from-gray-800 to-gray-900",
    },
    {
      type: "phim-le",
      label: "Phim Lẻ",
      icon: Film,
      description: "Thu thập dữ liệu phim điện ảnh",
      gradient: "from-gray-700 to-gray-800",
    },
    {
      type: "hoat-hinh",
      label: "Hoạt Hình",
      icon: Zap,
      description: "Thu thập dữ liệu phim hoạt hình",
      gradient: "from-gray-600 to-gray-700",
    },
  ];

  return (
    <div className="fixed px-2 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full text-gray-900 border-0 overflow-hidden">
        {/* Header với gradient */}
        <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">Crawl Phim</h2>
              <p className="text-gray-300 text-sm">
                Thu thập dữ liệu phim từ nguồn
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors p-1 hover:bg-white hover:bg-opacity-10 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-100 flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-lg mt-2"></div>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-6">
            {/* Input fields với styling cải thiện */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-gray-700 font-medium text-sm">
                  Trang Bắt Đầu
                </label>
                <input
                  type="number"
                  name="start_page"
                  value={formData.start_page}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-gray-700 font-medium text-sm">
                  Trang Kết Thúc
                </label>
                <input
                  type="number"
                  name="end_page"
                  value={formData.end_page}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-gray-700 font-medium text-sm flex items-center gap-1">
                  <SlidersHorizontal size={16} />
                  Limit
                </label>
                <input
                  type="number"
                  name="limit"
                  value={formData.limit}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Crawl buttons với design card */}
            <div className="space-y-3 pt-2">
              <h3 className="text-gray-700 font-medium text-sm mb-3">
                Chọn loại phim cần crawl:
              </h3>
              {crawlOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={(e) => handleCrawl(e, option.type)}
                    className={`w-full p-4 rounded-xl bg-gradient-to-r ${option.gradient} text-white font-medium flex items-center gap-4 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100`}
                    disabled={loading !== null}
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-lg">
                      {loading === option.type ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <IconComponent size={20} />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-xs text-white text-opacity-80">
                        {option.description}
                      </div>
                    </div>
                    <div className="w-6 h-6 border-2 border-white border-opacity-30 rounded-lg flex items-center justify-center">
                      <PlayCircle
                        size={14}
                        className="text-white text-opacity-80"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </form>

          {/* Manual import single movie */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="text-gray-700 font-medium mb-2">Import phim thủ công</h3>
            <p className="text-xs text-gray-500 mb-3">Nhập `slug` (ưu tiên) hoặc TMDb ID để import một phim cụ thể.</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Slug (ví dụ: ten-phim-abc)"
                value={manualSlug}
                onChange={(e) => setManualSlug(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
              />
              <input
                type="text"
                placeholder="TMDb ID (ví dụ: 12345)"
                value={manualTmdbId}
                onChange={(e) => setManualTmdbId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
              />
            </div>
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={async () => {
                  setLoading('manual');
                  setError(null);
                  try {
                    const accessToken = localStorage.getItem('access_token');
                    if (!accessToken) {
                      throw new Error('Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.');
                    }

                    const payload = {};
                    if (manualSlug) payload.slug = manualSlug;
                    if (manualTmdbId) payload.tmdb_id = parseInt(manualTmdbId, 10) || undefined;

                    await axios.post(`${BASE_API_URL}/import/manual-movie/`, payload, {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                      }
                    });

                    toast.success('Đã xếp hàng import phim.');
                    onCrawlSuccess();
                    onClose();
                  } catch (err) {
                    console.error('Lỗi import phim thủ công:', err);
                    let message = 'Lỗi khi gửi yêu cầu import.';
                    if (err.response) {
                      if (err.response.status === 401) {
                        message = 'Không được phép — vui lòng đăng nhập với tài khoản admin.';
                      } else {
                        message = err.response.data.detail || message;
                      }
                    } else if (err.message) {
                      message = err.message;
                    }
                    toast.error(message);
                    setError(message);
                  } finally {
                    setLoading(null);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-800 to-black text-white font-medium disabled:opacity-50"
                disabled={loading !== null}
              >
                {loading === 'manual' ? <Loader2 size={16} className="animate-spin" /> : 'Import Movie'}
              </button>
            </div>
          </div>

          {/* Footer info */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Quá trình crawl có thể mất vài phút tùy thuộc vào số trang và giới
              hạn phim
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrawlModal;
