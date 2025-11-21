import React, { useState, useCallback, useEffect } from "react";
import {
  X,
  Plus,
  RefreshCcw,
  Search,
  Edit,
  Loader2,
  Trash2,
  Settings,
} from "lucide-react";
import { toast } from "react-toastify";

// Imported Modals and API functions (kept the same)
import AddEpisodeModal from "./AddEpisodeModal";
import EditAllLinksModal from "./EditAllLinksModal";
import EditEpisodeModal from "./EditEpisode";
import {
  deleteEpisode,
  searchMovies,
  fetchAllMovieData,
} from "../utils/apiMovie";

// --- Custom Hooks and Helper Components ---

const useMovieData = (phimSlug, initialPhimData) => {
  const [viewData, setViewData] = useState(initialPhimData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllMovieData(phimSlug);
      setViewData(data);
      toast.success("Dữ liệu đã được cập nhật thành công!");
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu tập phim:", e);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      toast.error("Tải dữ liệu thất bại.");
    } finally {
      setIsLoading(false);
    }
  }, [phimSlug]);

  const handleDeleteEpisode = async (episode, server) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa tập ${episode.tap_phim.so_tap} - ${episode.ngon_ngu} trên server ${server}?`
    );
    if (!confirmDelete) return;

    try {
      await deleteEpisode(episode, server);
      toast.success(
        `Đã xóa thành công tập ${episode.tap_phim.so_tap} - ${episode.ngon_ngu}!`
      );
      fetchData();
    } catch (err) {
      console.error("Lỗi khi xóa tập phim:", err);
      toast.error("Xóa tập phim thất bại. Vui lại thử lại.");
    }
  };

  return { viewData, isLoading, error, fetchData, handleDeleteEpisode };
};

// ---

/**
 * 2. Component for Server Selection Tabs (Segmented Control Style)
 * Now uses borders only on the selected button's color.
 */
const ServerTabs = ({ selectedServer, setSelectedServer }) => {
  const serverLabels = ["sv1", "sv2", "sv3"];

  return (
    // Removed external border
    <div className="flex gap-0">
      {serverLabels.map((server) => (
        <button
          key={server}
          onClick={() => setSelectedServer(server)}
          // Set a default border and make the selected one stand out
          className={`px-2.5 py-1 text-xs font-semibold transition-all duration-100 border border-gray-300 active:scale-100
            ${
              selectedServer === server
                ? "bg-blue-600 text-white border-blue-600 z-10" // Bring selected to front
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 -ml-px" // Use negative margin to overlap borders
            }
            ${server === "sv1" ? "rounded-l-sm" : ""} 
            ${server === "sv3" ? "rounded-r-sm" : ""}
            `}
        >
          SV{server.replace("sv", "")}
        </button>
      ))}
    </div>
  );
};

// ---

/**
 * New: Component for Episode Number Search
 */
const EpisodeSearchInput = ({
  episodeSearchTerm,
  setEpisodeSearchTerm,
  type,
}) => {
  return (
    <div className="relative flex-1 min-w-[120px]">
      <input
        type="number"
        placeholder={`Tìm tập ${type}...`}
        className="flex-grow w-full px-4 py-1.5 text-black bg-white border border-gray-300 rounded-sm text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pl-7"
        value={episodeSearchTerm}
        onChange={(e) => setEpisodeSearchTerm(e.target.value)}
      />
      <Search
        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
        size={12}
      />
      {episodeSearchTerm && (
        <button
          onClick={() => setEpisodeSearchTerm("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          title="Xóa tìm kiếm tập"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

// ---

/**
 * 3. Component for Rendering a Single Episode List
 * Reduced borders on episode group cards and focused borders on individual links.
 */
const EpisodeList = ({
  episodes,
  selectedServerState,
  phimSlug,
  handleDeleteEpisode,
  setEditingAllLinksEpisode,
  setEditingEpisode,
  episodeSearchTerm,
}) => {
  const episodeList = episodes?.[selectedServerState] || [];

  let uniqueEpisodeNumbers = [
    ...new Set(episodeList.map((tap) => tap?.tap_phim?.so_tap)),
  ].sort((a, b) => a - b);

  if (episodeSearchTerm) {
    const searchNumber = parseInt(episodeSearchTerm, 10);
    if (!isNaN(searchNumber)) {
      uniqueEpisodeNumbers = uniqueEpisodeNumbers.filter((so_tap) =>
        String(so_tap).includes(String(searchNumber))
      );
    }
  }

  if (uniqueEpisodeNumbers.length === 0) {
    return (
      <div className="text-center py-4 border border-dashed border-gray-300 bg-white">
        <p className="text-gray-500 italic text-xs px-2">
          {episodeSearchTerm
            ? `Không tìm thấy tập phim số ${episodeSearchTerm} trên server này.`
            : "Chưa có tập phim nào trên server này."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {" "}
      {/* Reduced space-y */}
      {uniqueEpisodeNumbers.map((so_tap) => {
        if (!so_tap) return null;
        const episode = episodeList.find((e) => e.tap_phim?.so_tap === so_tap);
        const skipIntroTime = episode?.tap_phim?.skip_intro_time;

        return (
          <div
            key={so_tap}
            // Removed border and shadow, only padding
            className="bg-white p-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h5 className="font-extrabold text-base text-gray-900 flex items-center">
                  {so_tap}
                </h5>
                {skipIntroTime && (
                  <span className="text-xs font-medium bg-blue-50 text-blue-700 px-1.5 py-0 rounded-full border border-blue-200 flex items-center gap-1">
                    <Settings size={10} />
                    Skip: {skipIntroTime}s
                  </span>
                )}
              </div>

              {/* Edit All Links Button - Compact style */}
              <button
                onClick={() =>
                  setEditingAllLinksEpisode({
                    slug: phimSlug,
                    so_tap,
                    skip_intro_time: skipIntroTime || "",
                  })
                }
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300 active:scale-100"
                title="Sửa tất cả link và skip intro của tập phim này"
              >
                <Settings size={14} />
                <span>Sửa Tổng Thể</span>
              </button>
            </div>

            {/* Individual Links Container - Flatter list */}
            <div className="space-y-1">
              {episodeList
                .filter((tap) => tap?.tap_phim?.so_tap === so_tap)
                .map((tap) => (
                  <div
                    key={tap.id}
                    className="flex items-start justify-between p-1 bg-white rounded-none  hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-1">
                      <a
                        href={tap.link_video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors block break-all underline" // Removed truncate for full link visibility
                      >
                        {tap.link_video}
                      </a>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-1 flex-shrink-0 pt-0.5">
                      <button
                        onClick={() =>
                          setEditingEpisode({
                            ...tap,
                            server: selectedServerState,
                          })
                        }
                        className="p-0.5 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Sửa link video này"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteEpisode(tap, selectedServerState)
                        }
                        className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                        title="Xóa link video này"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- MovieSearch component ---

const MovieSearch = ({
  searchTerm,
  setSearchTerm,
  isSearching,
  searchResults,
}) => {
  return (
    // Removed external border and shadow
    <div className="bg-white p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-sm bg-red-100 flex items-center justify-center">
          <Search className="w-3 h-3 text-red-600" />
        </div>
        <h2 className="text-base font-medium text-gray-900">Tìm Kiếm Phim</h2>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm phim bằng tên..."
          className="w-full pl-9 pr-9 py-2 text-black bg-white border border-gray-300 rounded-sm text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          size={14}
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm("");
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Xóa tìm kiếm"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isSearching && (
        <div className="flex items-center justify-center p-3">
          <Loader2 size={18} className="animate-spin text-gray-900" />
          <span className="ml-2 text-xs font-semibold text-gray-700">
            Đang tìm kiếm...
          </span>
        </div>
      )}

      {!isSearching && searchTerm && searchResults.length > 0 && (
        // Added back border to the result list for containment
        <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-sm p-1 mt-2 bg-white">
          <ul className="divide-y divide-gray-200">
            {searchResults.map((phim) => (
              <li
                key={phim.slug}
                onClick={() => {
                  window.location.href = `/phim/${phim.slug}`;
                }}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer transition-colors duration-200 rounded-sm"
              >
                <img
                  src={phim.poster_url}
                  alt={phim.ten_phim}
                  className="w-8 h-12 object-cover rounded-sm flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate text-gray-900">
                    {phim.ten_phim}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    Năm phát hành: {phim.nam_phat_hanh}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isSearching && searchTerm && searchResults.length === 0 && (
        <p className="text-center text-gray-500 italic p-3 text-xs">
          Không tìm thấy kết quả nào.
        </p>
      )}
    </div>
  );
};

// --- Main Component ---

const ViewMovieModal = ({ phimData: initialPhimData, phimSlug }) => {
  const { viewData, isLoading, error, fetchData, handleDeleteEpisode } =
    useMovieData(phimSlug, initialPhimData);

  const [selectedVietsubServer, setSelectedVietsubServer] = useState("sv1");
  const [selectedThuyetminhServer, setSelectedThuyetminhServer] =
    useState("sv1");

  const [showAddEpisodeModal, setShowAddEpisodeModal] = useState(false);
  const [editingAllLinksEpisode, setEditingAllLinksEpisode] = useState(null);
  const [editingEpisode, setEditingEpisode] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [vietsubEpisodeSearch, setVietsubEpisodeSearch] = useState("");
  const [thuyetminhEpisodeSearch, setThuyetminhEpisodeSearch] = useState("");

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await searchMovies(query);
      setSearchResults(response);
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

  const movieTitle =
    viewData?.vietsub?.sv1?.[0]?.tap_phim?.phim?.ten_phim ||
    viewData?.thuyetminh?.sv1?.[0]?.tap_phim?.phim?.ten_phim ||
    phimSlug;

  return (
    <div className="bg-gray-100 min-h-screen p-2 sm:py-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-medium text-gray-900">
              Quản lý Tập Phim
            </h1>
            <p className="text-xs text-gray-500">
              Quản lý link video, skip intro cho từng tập phim
            </p>
          </div>
          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-1.5 bg-white text-gray-600 border border-gray-300 rounded-sm hover:bg-gray-100 transition-colors disabled:opacity-60"
            title="Tải lại dữ liệu"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin text-blue-600" />
            ) : (
              <RefreshCcw
                size={16}
                className="text-gray-500 hover:text-blue-600"
              />
            )}
          </button>
        </div>

        {/* --- Movie Search Feature --- */}
        <MovieSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isSearching={isSearching}
          searchResults={searchResults}
        />

        {/* --- Main Content Card: Movie Details and Episode Lists --- */}
        {!searchTerm && (
          // Removed border, shadow, and reduced background opacity on the main container
          <div className="bg-white p-4">
            <div className="flex flex-wrap items-center gap-2 mb-4 border-b pb-3 border-gray-200">
              <div className="w-6 h-6 rounded-sm bg-blue-100 flex items-center justify-center">
                <Settings className="w-3 h-3 text-blue-600" />
              </div>
              <h2 className="text-base font-medium text-gray-900">
                Chi Tiết Phim:
                <span className="text-blue-600 font-extrabold ml-2">
                  {movieTitle}
                </span>
              </h2>
              {/* Add Episode Button */}
              <button
                onClick={() => setShowAddEpisodeModal(true)}
                className="w-auto ml-auto flex-shrink-0 flex justify-center items-center gap-1 px-2.5 py-1.5 font-medium text-xs rounded-sm transition-all bg-gray-900 text-white hover:bg-black active:scale-100"
                title="Thêm tập phim mới"
              >
                <Plus size={14} />
                <span>Thêm Tập</span>
              </button>
            </div>

            {/* Loading/Error State */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-6 h-32 bg-gray-50 rounded-sm">
                <Loader2
                  size={20}
                  className="animate-spin text-blue-600 mb-2"
                />
                <p className="text-xs font-semibold text-gray-700">
                  Đang tải dữ liệu...
                </p>
              </div>
            ) : error ? (
              <div className="text-center p-3 bg-red-50 text-red-700 rounded-sm border border-red-200 text-xs">
                <h3 className="text-sm font-bold">Lỗi</h3>
                <p className="mt-1 text-gray-800">{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* --- Vietsub Episodes --- */}
                {/* Simplified structure: minimal padding, light background, removed inner border/shadow */}
                <div className="p-2 bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-300">
                    <h4 className="text-sm font-bold text-gray-900 flex-shrink-0">
                      Vietsub
                    </h4>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-1">
                      <EpisodeSearchInput
                        episodeSearchTerm={vietsubEpisodeSearch}
                        setEpisodeSearchTerm={setVietsubEpisodeSearch}
                        type="Vietsub"
                      />
                      <ServerTabs
                        selectedServer={selectedVietsubServer}
                        setSelectedServer={setSelectedVietsubServer}
                      />
                    </div>
                  </div>
                  <EpisodeList
                    episodes={viewData?.vietsub}
                    selectedServerState={selectedVietsubServer}
                    phimSlug={phimSlug}
                    handleDeleteEpisode={handleDeleteEpisode}
                    setEditingAllLinksEpisode={setEditingAllLinksEpisode}
                    setEditingEpisode={setEditingEpisode}
                    episodeSearchTerm={vietsubEpisodeSearch}
                  />
                </div>

                {/* --- Thuyết Minh Episodes --- */}
                <div className="p-2 bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-300">
                    <h4 className="text-sm font-bold text-gray-900 flex-shrink-0">
                      Thuyết Minh
                    </h4>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-1">
                      <EpisodeSearchInput
                        episodeSearchTerm={thuyetminhEpisodeSearch}
                        setEpisodeSearchTerm={setThuyetminhEpisodeSearch}
                        type="Thuyết Minh"
                      />
                      <ServerTabs
                        selectedServer={selectedThuyetminhServer}
                        setSelectedServer={setSelectedThuyetminhServer}
                      />
                    </div>
                  </div>
                  <EpisodeList
                    episodes={viewData?.thuyetminh}
                    selectedServerState={selectedThuyetminhServer}
                    phimSlug={phimSlug}
                    handleDeleteEpisode={handleDeleteEpisode}
                    setEditingAllLinksEpisode={setEditingAllLinksEpisode}
                    setEditingEpisode={setEditingEpisode}
                    episodeSearchTerm={thuyetminhEpisodeSearch}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Modals --- (kept the same) */}
        {showAddEpisodeModal && (
          <AddEpisodeModal
            onClose={() => setShowAddEpisodeModal(false)}
            phimSlug={phimSlug}
            onEpisodeAdded={() => {
              fetchData();
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
              fetchData();
              setEditingEpisode(null);
            }}
          />
        )}

        {editingAllLinksEpisode && (
          <EditAllLinksModal
            phimSlug={editingAllLinksEpisode.slug}
            soTap={editingAllLinksEpisode.so_tap}
            skipIntroTime={editingAllLinksEpisode.skip_intro_time}
            onClose={() => setEditingAllLinksEpisode(null)}
            onUpdate={fetchData}
          />
        )}
      </div>
    </div>
  );
};

export default ViewMovieModal;
