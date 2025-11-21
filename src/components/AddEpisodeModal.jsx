// src/components/AddEpisodeModal.jsx
import React, { useState } from "react";
import axios from "axios";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { BASE_API_URL } from "../config/api";

const AddEpisodeModal = ({ onClose, phimSlug, onEpisodeAdded }) => {
  const [soTap, setSoTap] = useState("");
  const [linkVietsubSv1, setLinkVietsubSv1] = useState("");
  const [linkVietsubSv2, setLinkVietsubSv2] = useState("");
  const [linkVietsubSv3, setLinkVietsubSv3] = useState("");
  const [linkThuyetminhSv1, setLinkThuyetminhSv1] = useState("");
  const [linkThuyetminhSv2, setLinkThuyetminhSv2] = useState("");
  const [linkThuyetminhSv3, setLinkThuyetminhSv3] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const videoSources = [];

    if (linkVietsubSv1 || linkThuyetminhSv1) {
      videoSources.push({
        server_id: 1,
        link_vietsub: linkVietsubSv1 || null,
        link_thuyetminh: linkThuyetminhSv1 || null,
      });
    }

    if (linkVietsubSv2 || linkThuyetminhSv2) {
      videoSources.push({
        server_id: 2,
        link_vietsub: linkVietsubSv2 || null,
        link_thuyetminh: linkThuyetminhSv2 || null,
      });
    }

    if (linkVietsubSv3 || linkThuyetminhSv3) {
      videoSources.push({
        server_id: 3,
        link_vietsub: linkVietsubSv3 || null,
        link_thuyetminh: linkThuyetminhSv3 || null,
      });
    }

    if (videoSources.length === 0) {
      toast.error("Vui lòng nhập ít nhất một link video!");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      phim_slug: phimSlug,
      so_tap: soTap,
      video_sources: videoSources,
    };

    try {
      const apiUrl = `${BASE_API_URL}/import/manual-episode-import`;
      const response = await axios.post(apiUrl, payload, {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      toast.success(response.data.message || "Thêm tập phim thành công!");

      if (onEpisodeAdded) {
        onEpisodeAdded();
      }

      setSoTap("");
      setLinkVietsubSv1("");
      setLinkVietsubSv2("");
      setLinkThuyetminhSv1("");
      setLinkThuyetminhSv2("");
      setLinkVietsubSv3("");
      setLinkThuyetminhSv3("");
      onClose();
    } catch (error) {
      console.error("Lỗi khi thêm tập phim:", error);

      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.detail ||
          "Có lỗi xảy ra từ server";
        toast.error(errorMessage);
      } else if (error.request) {
        toast.error(
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm p-4">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto text-gray-900 border border-gray-200">
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
          <h2 className="text-xl font-bold text-gray-900">Thêm Tập Phim Mới</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="soTap"
              className="block text-sm font-medium text-gray-700"
            >
              Số Tập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="soTap"
              value={soTap}
              onChange={(e) => setSoTap(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-gray-900 focus:ring focus:ring-gray-900 focus:ring-opacity-50"
              placeholder="Ví dụ:Tập 1, Tập 2, 18, Full"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Server 1
              </h3>
              <div className="space-y-2">
                <div>
                  <label
                    htmlFor="linkVietsubSv1"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Link Vietsub
                  </label>
                  <input
                    type="url"
                    id="linkVietsubSv1"
                    value={linkVietsubSv1}
                    onChange={(e) => setLinkVietsubSv1(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-xs px-2 py-1.5 focus:border-gray-900 focus:ring focus:ring-gray-900 focus:ring-opacity-50"
                    placeholder="https://s6.kkphimplayer6.com/..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="linkThuyetminhSv1"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Link Thuyết Minh
                  </label>
                  <input
                    type="url"
                    id="linkThuyetminhSv1"
                    value={linkThuyetminhSv1}
                    onChange={(e) => setLinkThuyetminhSv1(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-xs px-2 py-1.5 focus:border-gray-900 focus:ring focus:ring-gray-900 focus:ring-opacity-50"
                    placeholder="https://s6.kkphimplayer6.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Server 2 */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Server 2
              </h3>
              <div className="space-y-2">
                <div>
                  <label
                    htmlFor="linkVietsubSv2"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Link Vietsub
                  </label>
                  <input
                    type="url"
                    id="linkVietsubSv2"
                    value={linkVietsubSv2}
                    onChange={(e) => setLinkVietsubSv2(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-xs px-2 py-1.5 focus:border-gray-900 focus:ring focus:ring-gray-900 focus:ring-opacity-50"
                    placeholder="https://s6.kkphimplayer6.com/..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="linkThuyetminhSv2"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Link Thuyết Minh
                  </label>
                  <input
                    type="url"
                    id="linkThuyetminhSv2"
                    value={linkThuyetminhSv2}
                    onChange={(e) => setLinkThuyetminhSv2(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-xs px-2 py-1.5 focus:border-gray-900 focus:ring focus:ring-gray-900 focus:ring-opacity-50"
                    placeholder="https://s6.kkphimplayer6.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Server 3 */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Server 3
              </h3>
              <div className="space-y-2">
                <div>
                  <label
                    htmlFor="linkVietsubSv3"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Link Vietsub
                  </label>
                  <input
                    type="url"
                    id="linkVietsubSv3"
                    value={linkVietsubSv3}
                    onChange={(e) => setLinkVietsubSv3(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-xs px-2 py-1.5 focus:border-gray-900 focus:ring focus:ring-gray-900 focus:ring-opacity-50"
                    placeholder="https://s6.kkphimplayer6.com/..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="linkThuyetminhSv3"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Link Thuyết Minh
                  </label>
                  <input
                    type="url"
                    id="linkThuyetminhSv3"
                    value={linkThuyetminhSv3}
                    onChange={(e) => setLinkThuyetminhSv3(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-xs px-2 py-1.5 focus:border-gray-900 focus:ring focus:ring-gray-900 focus:ring-opacity-50"
                    placeholder="https://s6.kkphimplayer6.com/..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-xs text-yellow-700">
              <strong>Lưu ý:</strong> Vui lòng nhập ít nhất một link video cho
              một trong ba server.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black transition-colors duration-200 text-white font-semibold rounded-lg shadow-lg text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang xử lý...
                </>
              ) : (
                <>
                  <Plus size={16} /> Thêm Tập Phim
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEpisodeModal;
