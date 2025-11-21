import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import axios from "axios";
import {
  Search,
  Calendar,
  Clock,
  Plus,
  X,
  Film,
  Loader2,
  Trash2,
} from "lucide-react";

const THU_TRONG_TUAN = {
  thu_hai: "Thứ Hai",
  thu_ba: "Thứ Ba",
  thu_tu: "Thứ Tư",
  thu_nam: "Thứ Năm",
  thu_sau: "Thứ Sáu",
  thu_bay: "Thứ Bảy",
  chu_nhat: "Chủ Nhật",
};

const DAY_TO_NUMBER = {
  "Thứ Hai": 2,
  "Thứ Ba": 3,
  "Thứ Tư": 4,
  "Thứ Năm": 5,
  "Thứ Sáu": 6,
  "Thứ Bảy": 7,
  "Chủ Nhật": 8,
};

import { BASE_API_URL } from "../config/api";

const BulkLichChieuManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [selectedDay, setSelectedDay] = useState(THU_TRONG_TUAN.thu_hai);
  const [showTime, setShowTime] = useState("18:00");
  const [loading, setLoading] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState(null);
  const [scheduledMovies, setScheduledMovies] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const debounceTimeoutRef = useRef(null);
  const thuTrongTuanOptions = useMemo(() => Object.values(THU_TRONG_TUAN), []);
  const selectedSlugs = useMemo(
    () => selectedMovies.map((p) => p.slug),
    [selectedMovies]
  );

  // Toast notification
  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchScheduledMovies = useCallback(async (dayName) => {
    const dayNumber = DAY_TO_NUMBER[dayName];
    if (!dayNumber) return;

    setLoadingSchedule(true);
    try {
      const response = await axios.get(
        `${BASE_API_URL}/phim/lich-chieu/${dayNumber}`
      );
      setScheduledMovies(response.data);
    } catch (err) {
      console.error("Lỗi khi tải lịch chiếu:", err);
      showToast(`Lỗi khi tải lịch chiếu cho ${dayName}`, "error");
      setScheduledMovies([]);
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduledMovies(selectedDay);
  }, [selectedDay, fetchScheduledMovies]);

  const handleSearch = useCallback(
    async (query) => {
      if (!query || query.trim() === "") {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_API_URL}/search/`, {
          params: { q: query },
        });
        const newResults = response.data.filter(
          (phim) => !selectedSlugs.includes(phim.slug)
        );
        setSearchResults(newResults);
      } catch (err) {
        console.error(err);
        showToast("Lỗi khi tìm kiếm phim", "error");
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedSlugs]
  );

  const onSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  const toggleMovieSelection = (phim) => {
    setSelectedMovies((prevSelected) => {
      const isSelected = prevSelected.some((p) => p.id === phim.id);
      if (isSelected) {
        return prevSelected.filter((p) => p.id !== phim.id);
      } else {
        return [...prevSelected, phim];
      }
    });

    setSearchResults((prevResults) =>
      prevResults.filter((p) => p.id !== phim.id)
    );
    setSearchTerm("");
  };

  const handleBulkCreate = async () => {
    if (selectedMovies.length === 0) {
      showToast("Vui lòng chọn ít nhất một bộ phim", "error");
      return;
    }

    setLoading(true);
    const dayNumber = DAY_TO_NUMBER[selectedDay];

    if (!dayNumber) {
      showToast(
        `Không tìm thấy số tương ứng cho ngày "${selectedDay}"`,
        "error"
      );
      setLoading(false);
      return;
    }

    const bulkData = {
      phim_slugs: selectedSlugs,
      thu_trong_tuan: dayNumber,
      gio_chieu: showTime,
    };

    try {
      const response = await axios.post(
        `${BASE_API_URL}/phim/bulk-lich-chieu`,
        bulkData
      );
      showToast(response.data.message);
      setSelectedMovies([]);
      fetchScheduledMovies(selectedDay);
    } catch (err) {
      let errorMessage = "Đã xảy ra lỗi không xác định khi thêm lịch chiếu";
      const errorDetail = err.response?.data?.detail;

      if (Array.isArray(errorDetail)) {
        errorMessage = errorDetail
          .map((e) => `[${e.loc.slice(-1).join("")}]: ${e.msg}`)
          .join("; ");
      } else if (typeof errorDetail === "string") {
        errorMessage = errorDetail;
      }

      console.error("Chi tiết lỗi API:", err.response?.data);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = useCallback(
    async (slug, dayName) => {
      const daySlug = DAY_TO_NUMBER[dayName];

      if (!daySlug) {
        showToast(
          `Không tìm thấy slug tương ứng cho ngày "${dayName}"`,
          "error"
        );
        return;
      }

      if (
        !window.confirm(
          `Bạn có chắc chắn muốn xóa lịch chiếu của phim "${slug}" vào ${dayName} không?`
        )
      ) {
        return;
      }

      setDeletingSlug(slug);

      try {
        await axios.delete(
          `${BASE_API_URL}/phim/${slug}/lich-chieu?thu_trong_tuan=${daySlug}`
        );
        showToast(
          `Đã xóa lịch chiếu của phim ${slug} vào ${dayName} thành công`
        );
        setScheduledMovies((prev) => prev.filter((p) => p.slug !== slug));
      } catch (err) {
        let errorMessage = "Đã xảy ra lỗi không xác định khi xóa lịch chiếu";
        const errorDetail = err.response?.data?.detail;

        if (typeof errorDetail === "string") {
          errorMessage = errorDetail;
        }

        console.error("Chi tiết lỗi API:", err.response?.data);
        showToast(`Lỗi xóa lịch chiếu: ${errorMessage}`, "error");
      } finally {
        setDeletingSlug(null);
      }
    },
    [selectedDay]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg border flex items-center gap-3 animate-slide-in ${
              toastMessage.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                toastMessage.type === "error" ? "bg-red-500" : "bg-emerald-500"
              }`}
            >
              {toastMessage.type === "error" ? (
                <X className="w-3 h-3 text-white" />
              ) : (
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="text-sm font-medium">{toastMessage.message}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-1">
            Quản lý lịch chiếu
          </h1>
          <p className="text-sm text-gray-500">
            Thêm và xem lịch chiếu phim theo ngày
          </p>
        </div>

        {/* Schedule Settings Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">
              Cài đặt lịch chiếu
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Thứ trong tuần
              </label>
              <div className="relative">
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full px-4 py-2.5  text-black bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                >
                  {thuTrongTuanOptions.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Giờ chiếu
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={showTime}
                  onChange={(e) => setShowTime(e.target.value)}
                  className="w-full px-4 text-black py-2.5 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleBulkCreate}
                disabled={selectedMovies.length === 0 || loading}
                className={`w-full py-2.5 px-4 rounded font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  selectedMovies.length === 0 || loading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang thêm...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Thêm ({selectedMovies.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Search & Selection */}
          <div className="space-y-6">
            {/* Search Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-gray-400" />
                <h3 className="text-base font-medium text-gray-900">
                  Tìm kiếm phim
                </h3>
              </div>

              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Nhập tên phim..."
                  value={searchTerm}
                  onChange={onSearchChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border text-black border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>Đang tìm...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((phim) => (
                      <button
                        key={phim.id}
                        onClick={() => toggleMovieSelection(phim)}
                        className="w-full flex items-center gap-3 p-3 rounded hover:bg-gray-50 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                          <Plus className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {phim.ten_phim}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {phim.slug}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchTerm ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    Không tìm thấy kết quả
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    Bắt đầu gõ để tìm kiếm
                  </div>
                )}
              </div>
            </div>

            {/* Selected Movies Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-gray-400" />
                  <h3 className="text-base font-medium text-gray-900">
                    Đã chọn
                  </h3>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {selectedMovies.length} phim
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {selectedMovies.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded">
                    <Film className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Chưa chọn phim nào</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {selectedMovies.map((phim) => (
                      <div
                        key={phim.id}
                        className="flex items-center gap-3 p-3 bg-blue-50 rounded group hover:bg-blue-100 transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Film className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {phim.ten_phim}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleMovieSelection(phim)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Scheduled Movies */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h3 className="text-base font-medium text-gray-900">
                  Lịch chiếu
                </h3>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                {selectedDay}
              </span>
            </div>

            <div className="h-[580px] overflow-y-auto">
              {loadingSchedule ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Đang tải...</span>
                </div>
              ) : scheduledMovies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <Calendar className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">Chưa có lịch chiếu</p>
                  <p className="text-xs text-gray-400 mt-1">
                    vào {selectedDay}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduledMovies.map((phim) => {
                    const lichChieu = phim.lich_chieu.find(
                      (lc) => lc.thu_trong_tuan === DAY_TO_NUMBER[selectedDay]
                    );
                    const isDeleting = deletingSlug === phim.slug;

                    return (
                      <div
                        key={phim.id}
                        className="p-4 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate mb-1">
                              {phim.ten_phim}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {phim.slug}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">
                                {lichChieu ? lichChieu.gio_chieu : "---"}
                              </span>
                            </div>
                            {lichChieu && (
                              <button
                                onClick={() =>
                                  handleDeleteSchedule(phim.slug, selectedDay)
                                }
                                disabled={isDeleting}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                                  isDeleting
                                    ? "bg-gray-200 cursor-not-allowed"
                                    : "hover:bg-red-100"
                                }`}
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BulkLichChieuManager;
