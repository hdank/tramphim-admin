import React, { useState } from "react";
import axios from "axios";
import { X, Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { BASE_API_URL } from "../config/api";

const EditEpisodeModal = ({ episode, server, onClose, onUpdate }) => {
  const [newLink, setNewLink] = useState(episode.link_video);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const payload = { link_video: newLink };
      const apiUrl = `${BASE_API_URL}/phim/${episode.tap_phim.phim.slug}/tap/${episode.tap_phim.so_tap}/${episode.ngon_ngu}/edit-link/?server=${server}`;
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
    <div className="fixed px-2 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full text-gray-900 border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-900 to-black text-white p-3 flex justify-between items-center">
          <h2 className="text-base font-bold">
            Sửa Link {episode.tap_phim.so_tap}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors p-1 hover:bg-white hover:bg-opacity-10 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-900">
            Phim:{" "}
            <span className="font-semibold">
              {episode.tap_phim.phim.ten_phim}
            </span>
          </p>
          <p className="text-xs text-gray-900">
            Ngôn ngữ: <span className="font-semibold">{episode.ngon_ngu}</span>
          </p>
          <div>
            <label className="block text-gray-900 font-medium text-xs mb-1">
              Link Video Mới
            </label>
            <input
              type="text"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-gray-50 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all duration-200 text-xs"
            />
          </div>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-white font-semibold rounded-lg shadow-md disabled:bg-gray-400 text-sm"
          >
            {isUpdating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save size={16} /> Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEpisodeModal;
