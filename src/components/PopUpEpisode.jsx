import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { X, Video, Headphones, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import AddEpisodeModal from "./AddEpisodeModal";
import EditEpisodeModal from "./AddEpisodeModal";
import { BASE_API_URL } from "../config/api";

const ViewMovieModal = ({ onClose, viewData, onEpisodeAdded }) => {
  const [currentPhimSlug, setCurrentPhimSlug] = useState(viewData.slug);
  const [localViewData, setLocalViewData] = useState(viewData);
  const [showAddEpisodeModal, setShowAddEpisodeModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);

  // Separate states for each server tab
  const [selectedVietsubServer, setSelectedVietsubServer] = useState("sv1");
  const [selectedThuyetminhServer, setSelectedThuyetminhServer] =
    useState("sv1");

  const fetchData = useCallback(async () => {
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

      setLocalViewData({
        ten_phim: viewData.ten_phim,
        slug: viewData.slug,
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
      });
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu tập phim:", e);
      toast.error("Không thể tải dữ liệu. Vui lòng thử lại.");
    }
  }, [currentPhimSlug, viewData.ten_phim, viewData.slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderServerTabs = (type) => {
    const selectedServerState =
      type === "vietsub" ? selectedVietsubServer : selectedThuyetminhServer;
    const setSelectedServerState =
      type === "vietsub"
        ? setSelectedVietsubServer
        : setSelectedThuyetminhServer;

    return (
      <div className="flex gap-2">
        {["sv1", "sv2", "sv3"].map((serverName) => (
          <button
            key={serverName}
            onClick={() => setSelectedServerState(serverName)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200
              ${
                selectedServerState === serverName
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            Server {serverName.replace("sv", "")}
          </button>
        ))}
      </div>
    );
  };

  const renderEpisodes = (episodes, selectedServerState) => {
    const episodeList = episodes?.[selectedServerState] || [];

    if (episodeList.length === 0) {
      return (
        <p className="text-gray-600">Chưa có tập phim nào trên server này.</p>
      );
    }
    return (
      <div className="border border-gray-300 rounded-lg p-3 overflow-y-auto pr-2 bg-gray-100 max-h-90">
        {episodeList.map((tap) => (
          <div
            key={tap.id}
            className="flex items-center justify-between mb-2 last:mb-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 break-words">
                <span className="font-semibold text-gray-900">
                  Tập {tap.tap_phim.so_tap}
                </span>
                <span className="text-gray-400 mx-1">|</span>
                <a
                  href={tap.link_video}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-800 underline"
                >
                  {tap.link_video}
                </a>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setEditingEpisode({ ...tap, server: selectedServerState })
                }
                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                title="Sửa link video"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDeleteEpisode(tap)}
                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
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

  const handleDeleteEpisode = async (episode) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa tập ${episode.tap_phim.so_tap} - ${episode.ngon_ngu}?`
    );
    if (!confirmDelete) {
      return;
    }

    try {
      const apiUrl = `${BASE_API_URL}/phim/${episode.tap_phim.phim.slug}/tap/${episode.tap_phim.so_tap}/delete/`;
      await axios.delete(apiUrl);
      toast.success(
        `Đã xóa thành công tập ${episode.tap_phim.so_tap} - ${episode.ngon_ngu}!`
      );
      fetchData();
    } catch (err) {
      console.error("Lỗi khi xóa tập phim:", err);
      toast.error("Xóa tập phim thất bại. Vui lòng thử lại.");
    }
  };

  const handleUpdateEpisode = () => {
    fetchData();
    setEditingEpisode(null);
  };

  const { ten_phim, slug, vietsub, thuyetminh } = localViewData;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-sm p-4">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto text-gray-900 border border-gray-200">
          <div className="flex lg:flex-row flex-col justify-between items-start lg:items-center mb-6 border-b border-gray-200 pb-4 gap-2">
            <h2 className="text-sm lg:text-lg font-bold text-gray-900">
              Chi Tiết Tập Phim: {ten_phim}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddEpisodeModal(true)}
                className="flex items-center gap-1 px-2 py-2 bg-gray-900 hover:bg-black transition-colors duration-200 text-white text-xs font-semibold rounded-lg shadow-lg"
              >
                <Plus size={16} /> Thêm Tập
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-900 transition-colors p-1 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center text-xl font-semibold text-gray-900">
                  <Video size={20} className="mr-2" />
                  Vietsub
                </h3>
                {renderServerTabs("vietsub")}
              </div>
              {renderEpisodes(vietsub, selectedVietsubServer)}
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center text-xl font-semibold text-gray-900">
                  <Headphones size={20} className="mr-2" />
                  Thuyết Minh
                </h3>
                {renderServerTabs("thuyetminh")}
              </div>
              {renderEpisodes(thuyetminh, selectedThuyetminhServer)}
            </div>
          </div>
        </div>
      </div>
      {showAddEpisodeModal && (
        <AddEpisodeModal
          onClose={() => setShowAddEpisodeModal(false)}
          phimSlug={slug}
          onEpisodeAdded={() => {
            onEpisodeAdded(slug);
            setShowAddEpisodeModal(false);
          }}
        />
      )}
      {editingEpisode && (
        <EditEpisodeModal
          episode={editingEpisode}
          server={editingEpisode.server}
          onClose={() => setEditingEpisode(null)}
          onUpdate={handleUpdateEpisode}
        />
      )}
    </>
  );
};

export default ViewMovieModal;
