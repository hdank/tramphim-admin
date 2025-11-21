// src/components/ViewMovieModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  X,
  Video,
  Headphones,
  Plus,
  RefreshCcw,
  Search,
  Edit,
  Save,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import AddEpisodeModal from "./AddEpisodeModal";
import { BASE_API_URL } from "../config/api";

const EditEpisodeModal = ({ episode, server, onClose, onUpdate }) => {
  const [newLink, setNewLink] = useState(episode.link_video);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const payload = { link_video: newLink };
      const apiUrl = `${BASE_API_URL}phim/${episode.tap_phim.phim.slug}/tap/${episode.tap_phim.so_tap}/${episode.ngon_ngu}/edit-link/?server=${server}`;
      await axios.patch(apiUrl, payload);

      toast.success(
        `Đã cập nhật link tập ${episode.tap_phim.so_tap} thành công!`
      );
      onUpdate();
    } catch (err) {
      console.error("Lỗi khi cập nhật link video:", err);
      toast.error("Cập nhật link thất bại. Vui lòng thử lại.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full text-gray-900 overflow-hidden transform transition-all scale-100">
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-4 sm:p-6 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold">
            Sửa Link Tập {episode.tap_phim.so_tap}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors p-1 hover:bg-white hover:bg-opacity-10 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-gray-900">
            Phim:{" "}
            <span className="font-semibold">
              {episode.tap_phim.phim.ten_phim}
            </span>
          </p>
          <p className="text-sm text-gray-900">
            Ngôn ngữ: <span className="font-semibold">{episode.ngon_ngu}</span>
          </p>
          <div>
            <label className="block text-gray-900 font-medium text-sm mb-1">
              Link Video Mới
            </label>
            <input
              type="text"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all duration-200 text-sm"
            />
          </div>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-white font-semibold rounded-lg shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save size={20} /> Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ViewMovieModal = ({ phimSlug }) => {
  const [currentPhimSlug, setCurrentPhimSlug] = useState(phimSlug);
  const [viewData, setViewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVietsubServer, setSelectedVietsubServer] = useState("sv1");
  const [selectedThuyetminhServer, setSelectedThuyetminhServer] =
    useState("sv1");
  const [showAddEpisodeModal, setShowAddEpisodeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);

  const fetchMovieData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        vietsubSv1Res,
        vietsubSv2Res,
        vietsubSv3Res,
        thuyetminhSv1Res,
        thuyetminhSv2Res,
        thuyetminhSv3Res,
      ] = await Promise.all([
        axios.get(
          `${BASE_API_URL}/phim/${currentPhimSlug}/vietsub/?server=sv1`
        ),
        axios.get(
          `${BASE_API_URL}/phim/${currentPhimSlug}/vietsub/?server=sv2`
        ),
        axios.get(
          `${BASE_API_URL}/phim/${currentPhimSlug}/vietsub/?server=sv3`
        ),
        axios.get(
          `${BASE_API_URL}/phim/${currentPhimSlug}/thuyetminh/?server=sv1`
        ),
        axios.get(
          `${BASE_API_URL}/phim/${currentPhimSlug}/thuyetminh/?server=sv2`
        ),
        axios.get(
          `${BASE_API_URL}/phim/${currentPhimSlug}/thuyetminh/?server=sv3`
        ),
      ]);

      const organizedData = {
        ten_phim:
          vietsubSv1Res.data[0]?.tap_phim.phim.ten_phim || currentPhimSlug,
        slug: currentPhimSlug,
        vietsub: {
          sv1: vietsubSv1Res.data,
          sv2: vietsubSv2Res.data,
          sv3: vietsubSv3Res.data,
        },
        thuyetminh: {
          sv1: thuyetminhSv1Res.data,
          sv2: thuyetminhSv2Res.data,
          sv3: thuyetminhSv3Res.data,
        },
      };

      setViewData(organizedData);
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu tập phim:", e);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      toast.error("Tải dữ liệu thất bại.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPhimSlug]);

  const handleDeleteEpisode = async (episode, server) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa tập ${episode.tap_phim.so_tap} - ${episode.ngon_ngu} trên server ${server}?`
    );
    if (!confirmDelete) {
      return;
    }

    try {
      const apiUrl = `${BASE_API_URL}/phim/${episode.tap_phim.phim.slug}/tap/${episode.tap_phim.so_tap}/delete/?server=${server}&ngon_ngu=${episode.ngon_ngu}`;
      await axios.delete(apiUrl);

      toast.success(
        `Đã xóa thành công tập ${episode.tap_phim.so_tap} - ${episode.ngon_ngu}!`
      );
      fetchMovieData();
    } catch (err) {
      console.error("Lỗi khi xóa tập phim:", err);
      toast.error("Xóa tập phim thất bại. Vui lòng thử lại.");
    }
  };

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const apiUrl = `${BASE_API_URL}/search/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm phim:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, handleSearch]);

  useEffect(() => {
    if (currentPhimSlug) {
      fetchMovieData();
    }
  }, [currentPhimSlug, fetchMovieData]);

  const renderServerTabs = (type) => {
    const selectedServerState =
      type === "vietsub" ? selectedVietsubServer : selectedThuyetminhServer;
    const setSelectedServerState =
      type === "vietsub"
        ? setSelectedVietsubServer
        : setSelectedThuyetminhServer;
    const servers = ["sv1", "sv2", "sv3"];

    return (
      <div className="flex gap-2">
        {servers.map((server) => (
          <button
            key={server}
            onClick={() => setSelectedServerState(server)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200
              ${
                selectedServerState === server
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            Server {server.replace("sv", "")}
          </button>
        ))}
      </div>
    );
  };

  const renderEpisodes = (episodes, selectedServerState, languageIcon) => {
    const episodeList = episodes?.[selectedServerState] || [];

    if (episodeList.length === 0) {
      return (
        <p className="text-gray-600 text-center py-4">
          Chưa có tập phim nào trên server này.
        </p>
      );
    }

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {episodeList.map((tap) => (
          <div
            key={tap.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex-1 min-w-0 flex items-center gap-2">
              {languageIcon}
              <p className="text-sm font-medium text-gray-900 truncate">
                Tập {tap.tap_phim.so_tap}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={tap.link_video}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline hidden md:block"
              >
                Xem Link
              </a>
              <button
                onClick={() =>
                  setEditingEpisode({ ...tap, server: selectedServerState })
                }
                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Sửa link video"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDeleteEpisode(tap, selectedServerState)}
                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Xóa tập phim"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <nav className="text-sm text-gray-500 mb-6">
          <a
            href="/danh-sach-phim/trang-1"
            className="hover:text-red-600 transition-colors duration-150 text-gray-600"
          >
            Danh Sách Phim
          </a>
          <span className="mx-2 text-gray-400">&gt;</span>
          <span className="text-gray-900 font-medium">Tập Phim</span>
        </nav>

        <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
              Quản Lý Tập Phim
            </h2>
            <div className="flex gap-3">
              <button
                onClick={fetchMovieData}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-white font-semibold rounded-lg shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <RefreshCcw size={20} className="animate-spin" />
                ) : (
                  <RefreshCcw size={20} />
                )}
                <span className="hidden sm:inline">Tải lại</span>
              </button>
              <button
                onClick={() => setShowAddEpisodeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black transition-all duration-200 text-white font-semibold rounded-lg shadow-md"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Thêm Tập</span>
              </button>
            </div>
          </div>

          <div className="relative mb-8">
            <input
              type="text"
              placeholder="Tìm kiếm phim..."
              className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-200 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            )}
            {isSearching ? (
              <p className="absolute top-full left-0 mt-2 text-gray-500">
                Đang tìm kiếm...
              </p>
            ) : searchTerm && searchResults.length > 0 ? (
              <ul className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((phim) => (
                  <li
                    key={phim.slug}
                    onClick={() => {
                      setCurrentPhimSlug(phim.slug);
                      setSearchTerm("");
                      setSearchResults([]);
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <img
                      src={phim.poster_url}
                      alt={phim.ten_phim}
                      className="w-10 h-14 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-gray-900">
                        {phim.ten_phim}
                      </p>
                      <p className="text-xs text-gray-600">
                        {phim.nam_phat_hanh}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : searchTerm && !isSearching ? (
              <p className="absolute top-full left-0 mt-2 text-gray-500">
                Không tìm thấy kết quả nào.
              </p>
            ) : null}
          </div>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Chi Tiết Tập Phim:{" "}
                <span className="text-red-600">{viewData?.ten_phim}</span>
              </h3>
            </div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <Loader2
                  size={32}
                  className="text-gray-500 animate-spin mb-4"
                />
                <p className="text-xl font-semibold text-gray-900">
                  Đang tải dữ liệu...
                </p>
              </div>
            ) : error ? (
              <div className="text-center p-8 bg-red-100 text-red-800 rounded-lg flex items-center justify-center gap-4">
                <AlertCircle size={24} className="text-red-600" />
                <p className="text-gray-900">{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cột Vietsub */}
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                    <h4 className="flex items-center text-lg font-semibold text-gray-900">
                      <Video size={20} className="mr-2 text-blue-600" /> Vietsub
                    </h4>
                    {renderServerTabs("vietsub")}
                  </div>
                  {renderEpisodes(
                    viewData?.vietsub,
                    selectedVietsubServer,
                    <Video size={16} className="text-blue-500" />
                  )}
                </div>

                {/* Cột Thuyết Minh */}
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                    <h4 className="flex items-center text-lg font-semibold text-gray-900">
                      <Headphones size={20} className="mr-2 text-blue-600" />{" "}
                      Thuyết Minh
                    </h4>
                    {renderServerTabs("thuyetminh")}
                  </div>
                  {renderEpisodes(
                    viewData?.thuyetminh,
                    selectedThuyetminhServer,
                    <Headphones size={16} className="text-blue-500" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddEpisodeModal && (
        <AddEpisodeModal
          onClose={() => setShowAddEpisodeModal(false)}
          phimSlug={currentPhimSlug}
          onEpisodeAdded={() => {
            fetchMovieData();
            setShowAddEpisodeModal(false);
          }}
        />
      )}

      {editingEpisode && (
        <EditEpisodeModal
          episode={editingEpisode}
          server={editingEpisode.server}
          onClose={() => setEditingEpisode(null)}
          onUpdate={() => {
            fetchMovieData();
            setEditingEpisode(null);
          }}
        />
      )}
    </div>
  );
};

export default ViewMovieModal;
