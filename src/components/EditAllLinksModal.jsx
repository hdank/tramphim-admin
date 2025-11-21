import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Save, Loader2, Film, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { BASE_API_URL } from "../config/api";

// Hàm chuyển đổi từ định dạng chuỗi "phút:giây" hoặc số giây sang giây
const convertToSeconds = (timeString) => {
  if (!timeString) return null;
  const parts = timeString.split(":");
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      return minutes * 60 + seconds;
    }
  }
  const seconds = parseInt(timeString, 10);
  return isNaN(seconds) ? null : seconds;
};

const formatSecondsToMinutes = (seconds) => {
  if (seconds === null || isNaN(seconds) || seconds === "") return "";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const EditAllLinksModal = ({
  phimSlug,
  soTap,
  onClose,
  onUpdate,
  skipIntroTime,
}) => {
  const [links, setLinks] = useState({
    vietsub: { sv1: "", sv2: "", sv3: "" },
    thuyetminh: { sv1: "", sv2: "", sv3: "" },
  });
  const [tapImageFile, setTapImageFile] = useState(null);
  const [tapImagePreviewUrl, setTapImagePreviewUrl] = useState(null);
  const [skipIntro, setSkipIntro] = useState(skipIntroTime || "");
  const [skipIntroInput, setSkipIntroInput] = useState(
    formatSecondsToMinutes(skipIntroTime)
  );
  const [applyToAll, setApplyToAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEpisodeData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${BASE_API_URL}/phim/${phimSlug}/tap/${soTap}/all-links/`
        );
        const fetchedLinks = {
          vietsub: { sv1: "", sv2: "", sv3: "" },
          thuyetminh: { sv1: "", sv2: "", sv3: "" },
        };
        response.data.forEach((link) => {
          if (
            link.ngon_ngu in fetchedLinks &&
            link.server.slug in fetchedLinks[link.ngon_ngu]
          ) {
            fetchedLinks[link.ngon_ngu][link.server.slug] = link.link_video;
          }
        });
        setLinks(fetchedLinks);
        if (response.data.length > 0 && response.data[0].tap_phim) {
          const fetchedSkipIntroTime =
            response.data[0].tap_phim.skip_intro_time || "";
          setTapImagePreviewUrl(response.data[0].tap_phim.tap_image || null);
          setSkipIntro(fetchedSkipIntroTime);
          setSkipIntroInput(formatSecondsToMinutes(fetchedSkipIntroTime));
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu tập phim:", error);
        toast.error("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEpisodeData();
  }, [phimSlug, soTap]);

  const handleSkipIntroChange = (e) => {
    const value = e.target.value;
    setSkipIntroInput(value);
    const seconds = convertToSeconds(value);
    setSkipIntro(seconds);
  };

  const handleLinkChange = (language, server, value) => {
    setLinks((prevLinks) => ({
      ...prevLinks,
      [language]: {
        ...prevLinks[language],
        [server]: value,
      },
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTapImageFile(file);
      setTapImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearImage = () => {
    setTapImageFile(null);
    setTapImagePreviewUrl(null);
  };

  const uploadImage = async (file) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const response = await axios.post(
        `${BASE_API_URL}/upload/img`,
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data.url;
    } catch (error) {
      console.error(`Lỗi khi tải ảnh lên:`, error);
      throw new Error(`Lỗi khi tải ảnh lên.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const updates = [];

    try {
      let newTapImage = tapImagePreviewUrl;
      if (tapImageFile) {
        newTapImage = await uploadImage(tapImageFile);
      }

      const shouldUpdateImage =
        tapImageFile || (tapImagePreviewUrl === null && skipIntroTime !== null); // Cập nhật nếu có file mới, hoặc nếu ảnh bị xóa (tapImagePreviewUrl=null)
      const shouldUpdateSkipIntro = skipIntro !== skipIntroTime;

      if (shouldUpdateImage || shouldUpdateSkipIntro) {
        if (applyToAll) {
          if (shouldUpdateSkipIntro) {
            updates.push(
              axios.patch(
                `${BASE_API_URL}/phim/${phimSlug}/update-all-episodes-skip-intro/`,
                { skip_intro_time: skipIntro }
              )
            );
          }
          // Image update is only for the current episode (cannot apply image to all)
          if (shouldUpdateImage) {
            updates.push(
              axios.patch(
                `${BASE_API_URL}/phim/${phimSlug}/tap/${soTap}/update-image/`,
                { tap_image: newTapImage }
              )
            );
          }
        } else {
          // Update only the current episode
          if (shouldUpdateImage) {
            updates.push(
              axios.patch(
                `${BASE_API_URL}/phim/${phimSlug}/tap/${soTap}/update-image/`,
                { tap_image: newTapImage }
              )
            );
          }
          if (shouldUpdateSkipIntro) {
            updates.push(
              axios.patch(
                `${BASE_API_URL}/phim/${phimSlug}/tap/${soTap}/update-skip-intro/`,
                { skip_intro_time: skipIntro }
              )
            );
          }
        }
      }

      // 2. Handle video links update
      for (const lang in links) {
        for (const sv in links[lang]) {
          // Gửi request PATCH để cập nhật link video
          updates.push(
            axios.patch(
              `${BASE_API_URL}/phim/${phimSlug}/tap/${soTap}/${lang}/edit-link/?server=${sv}`,
              { link_video: links[lang][sv] }
            )
          );
        }
      }

      await Promise.all(updates);

      toast.success(`Đã cập nhật thành công cho tập ${soTap}!`);
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);
      // Cố gắng hiển thị lỗi cụ thể nếu có
      const errorMessage =
        err.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ServerInputGroup = ({ title, language, servers }) => (
    <div className="bg-gray-100 rounded-lg p-4 shadow-inner space-y-3">
      <div className="text-center">
        <h3 className="text-md font-bold text-gray-900 bg-white px-4 py-1.5 rounded-full shadow-sm inline-block">
          {title}
        </h3>
      </div>

      <div className="space-y-3">
        {servers.map((sv) => (
          <div key={sv} className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Server {sv.slice(-1)}
            </label>

            <input
              type="text"
              placeholder={`Link ${title.toLowerCase()} server ${sv.slice(-1)}`}
              value={links[language][sv] || ""}
              onChange={(e) => handleLinkChange(language, sv, e.target.value)}
              className="w-full px-3 py-2 text-black rounded-md border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-300 transition-all duration-200 placeholder-gray-400 text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-60 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
        <div className="bg-gradient-to-r from-gray-900 to-black text-white p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Chỉnh sửa Link Video</h2>

              <p className="text-gray-300 mt-0.5 text-sm">
                {soTap}- Cập nhật tất cả server
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors p-1.5 hover:bg-white hover:bg-opacity-10 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="max-h-[68vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 size={36} className="animate-spin text-gray-900" />
                <p className="text-gray-500 text-base">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100 rounded-lg p-4 shadow-inner">
                  <div className="space-y-3">
                    <h3 className="text-md font-bold text-gray-900 text-center">
                      Ảnh Tập Phim
                    </h3>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-36 h-20 border border-gray-300 rounded-md overflow-hidden flex items-center justify-center bg-gray-200">
                        {tapImagePreviewUrl ? (
                          <img
                            src={tapImagePreviewUrl}
                            alt="Episode Preview"
                            className="w-full h-full object-fill"
                          />
                        ) : (
                          <Film size={24} className="text-gray-400" />
                        )}
                      </div>

                      <div className="flex-grow space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="block w-full text-xs  text-gray-900 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-300 file:text-gray-800 hover:file:bg-gray-400 transition-colors"
                        />
                        {(tapImagePreviewUrl || tapImageFile) && (
                          <button
                            type="button"
                            onClick={handleClearImage}
                            className="flex items-center text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            <Trash2 size={14} className="mr-1" /> Xóa ảnh hiện
                            tại
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-md font-bold text-gray-900 text-center">
                      Thời Gian Bỏ Qua Intro
                    </h3>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Thời gian (phút:giây hoặc giây)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 1:33 hoặc 93"
                        value={skipIntroInput}
                        onChange={handleSkipIntroChange}
                        className="w-full text-black px-3 py-2 rounded-md border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-300 transition-all duration-200 placeholder-gray-400 text-sm"
                      />
                    </div>

                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="apply-to-all"
                        checked={applyToAll}
                        onChange={(e) => setApplyToAll(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="apply-to-all"
                        className="text-sm font-medium text-gray-700"
                      >
                        Áp dụng **Skip Intro** cho tất cả các tập
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ServerInputGroup
                    title="Vietsub"
                    language="vietsub"
                    servers={["sv1", "sv2", "sv3"]}
                  />
                  <ServerInputGroup
                    title="Thuyết Minh"
                    language="thuyetminh"
                    servers={["sv1", "sv2", "sv3"]}
                  />
                </div>
              </div>
            )}
          </form>
        </div>
        {/* Footer */}
        {/* Giảm padding */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-gray-600">
              *Nhập link video cho từng server. Để trống nếu không có link.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Hủy
              </button>

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAllLinksModal;
