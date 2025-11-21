import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  Save,
  Upload,
  Trash2,
  Loader2,
  Calendar,
  Clock,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import { BASE_API_URL } from "../config/api";

const EditMovieModal = ({ editData, onClose, onUpdate }) => {
  if (!editData || !editData.phim || !editData.meta) {
    return null;
  }

  const phimData = editData.phim;
  const availableQuocgia = editData.meta.available_quocgia;
  const availableTheloai = editData.meta.available_theloai;

  const [formData, setFormData] = useState({
    ...phimData,
    quoc_gia: phimData.quoc_gia_obj?.code || "",
    the_loai: phimData.the_loai.map((tl) => tl.slug),
    trailer_url: phimData.trailer_url || "",
    poster_url: phimData.poster_url || "",
    banner_url: phimData.banner_url || "",
    ten_phim_image: phimData.ten_phim_image || null,
    chieu_rap: phimData.chieu_rap || false,
    luot_xem: phimData.luot_xem || 0,
    lich_chieu: phimData.lich_chieu || [],
  });

  const [posterFile, setPosterFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [titleImageFile, setTitleImageFile] = useState(null);

  const [posterPreviewUrl, setPosterPreviewUrl] = useState(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState(null);
  const [titleImagePreviewUrl, setTitleImagePreviewUrl] = useState(null);

  const [dienVienInput, setDienVienInput] = useState(
    phimData.dien_vien.map((dv) => dv.ten).join(", ")
  );
  const [loading, setLoading] = useState(false);
  const [updatingLichChieuIndex, setUpdatingLichChieuIndex] = useState(null);

  useEffect(() => {
    if (editData && editData.phim) {
      setFormData({
        ...editData.phim,
        quoc_gia: editData.phim.quoc_gia_obj?.code || "",
        the_loai: editData.phim.the_loai.map((tl) => tl.slug),
        trailer_url: editData.phim.trailer_url || "",
        poster_url: editData.phim.poster_url || "",
        banner_url: editData.phim.banner_url || "",
        ten_phim_image: editData.phim.ten_phim_image || null,
        chieu_rap: editData.phim.chieu_rap || false,
        luot_xem: editData.phim.luot_xem || 0,
        lich_chieu: editData.phim.lich_chieu || [],
      });
      setDienVienInput(editData.phim.dien_vien.map((dv) => dv.ten).join(", "));
      setPosterFile(null);
      setBannerFile(null);
      setTitleImageFile(null);
      setPosterPreviewUrl(null);
      setBannerPreviewUrl(null);
      setTitleImagePreviewUrl(null);
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTitleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTitleImageFile(file);
      setTitleImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearTitleImage = () => {
    setTitleImageFile(null);
    setTitleImagePreviewUrl(null);
    setFormData((prevData) => ({
      ...prevData,
      ten_phim_image: null,
    }));
  };

  const handleCheckboxChange = (slug) => {
    setFormData((prevData) => {
      const newTheloai = prevData.the_loai.includes(slug)
        ? prevData.the_loai.filter((s) => s !== slug)
        : [...prevData.the_loai, slug];
      return {
        ...prevData,
        the_loai: newTheloai,
      };
    });
  };

  const handleDienVienChange = (e) => {
    setDienVienInput(e.target.value);
  };

  const handleImageChange = (e, setImageFile, setPreviewUrl) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearImage = (setImageFile, setPreviewUrl, fieldName) => {
    setImageFile(null);
    setPreviewUrl(null);
    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: null,
    }));
  };

  const uploadImage = async (file, type) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const response = await axios.post(
        `${BASE_API_URL}/upload/${type}/`,
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data.url;
    } catch (error) {
      console.error(`Lỗi khi tải ảnh ${type} lên:`, error);
      throw new Error(`Lỗi khi tải ảnh ${type} lên.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedFormData = { ...formData };

      if (posterFile) {
        updatedFormData.poster_url = await uploadImage(posterFile, "poster");
      }
      if (bannerFile) {
        updatedFormData.banner_url = await uploadImage(bannerFile, "banner");
      }
      if (titleImageFile) {
        updatedFormData.ten_phim_image = await uploadImage(
          titleImageFile,
          "img"
        );
      }

      const dienVienList = dienVienInput
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name !== "");

      const dataToSend = {
        ...updatedFormData,
        dien_vien: dienVienList,
        chieu_rap: updatedFormData.chieu_rap,
      };

      const response = await axios.put(
        `${BASE_API_URL}/phim/${updatedFormData.slug}/`,
        dataToSend
      );

      // Call the modified function
      await updateLichChieu(updatedFormData.slug, updatedFormData.lich_chieu);

      onUpdate(response.data);
      toast.success(
        `Phim "${response.data.ten_phim}" đã được cập nhật thành công.`
      );
      onClose();
    } catch (error) {
      console.error("Lỗi khi cập nhật phim:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Có lỗi xảy ra khi cập nhật phim. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED FUNCTION: NO LONGER DELETES
  const updateLichChieu = async (slug, lichChieuList) => {
    const existingLichChieu = phimData.lich_chieu;
    const lichChieuToUpdate = [];
    const lichChieuToCreate = [];

    lichChieuList.forEach((current) => {
      const existing = existingLichChieu.find(
        (ex) => ex.thu_trong_tuan === current.thu_trong_tuan
      );

      if (existing) {
        if (existing.gio_chieu !== current.gio_chieu) {
          lichChieuToUpdate.push(current);
        }
      } else {
        if (current.thu_trong_tuan && current.gio_chieu) {
          lichChieuToCreate.push(current);
        }
      }
    });

    const updatePromises = [
      ...lichChieuToUpdate.map((lc) =>
        axios.put(`${BASE_API_URL}/phim/${slug}/lich-chieu`, lc)
      ),
      ...lichChieuToCreate.map((lc) =>
        axios.post(`${BASE_API_URL}/phim/${slug}/lich-chieu`, lc)
      ),
    ];

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Lỗi khi cập nhật lịch chiếu:", error);
      throw new Error("Lỗi khi cập nhật lịch chiếu.");
    }
  };

  const handleAddLichChieu = () => {
    setFormData((prev) => ({
      ...prev,
      lich_chieu: [
        ...prev.lich_chieu,
        { thu_trong_tuan: "", gio_chieu: "00:00" },
      ],
    }));
  };

  const handleRemoveLichChieu = async (index, thu_trong_tuan) => {
    const newLichChieu = formData.lich_chieu.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      lich_chieu: newLichChieu,
    }));

    if (thu_trong_tuan) {
      try {
        await axios.delete(`${BASE_API_URL}/phim/${formData.slug}/lich-chieu`, {
          params: { thu_trong_tuan: thu_trong_tuan },
        });
        toast.success(`Đã xóa lịch chiếu cho Thứ ${thu_trong_tuan}.`);
      } catch (error) {
        console.error("Lỗi khi xóa lịch chiếu:", error);
        toast.error("Lỗi khi xóa lịch chiếu.");
      }
    }
  };

  const handleUpdateSingleLichChieu = async (index) => {
    const { thu_trong_tuan, gio_chieu } = formData.lich_chieu[index];

    if (!thu_trong_tuan || !gio_chieu) {
      toast.error("Thứ và giờ chiếu không được để trống.");
      return;
    }

    setUpdatingLichChieuIndex(index);
    try {
      await axios.put(`${BASE_API_URL}/phim/${formData.slug}/lich-chieu`, {
        thu_trong_tuan,
        gio_chieu,
      });
      toast.success(
        `Cập nhật lịch chiếu cho Thứ ${thu_trong_tuan} thành công.`
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật lịch chiếu:", error);
      toast.error("Lỗi khi cập nhật lịch chiếu.");
    } finally {
      setUpdatingLichChieuIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto transform scale-95 md:scale-100 transition-transform duration-300 ease-in-out">
        <div className="flex flex-col p-4 md:p-6">
          <div className="flex justify-between items-center pb-3 mb-4 border-b-2 border-gray-100">
            <div className="flex items-center">
              <h2 className="text-lg md:text-xl font-extrabold text-gray-900">
                Sửa Phim:{" "}
                <span className="text-gray-600 font-semibold">
                  {formData.ten_phim}
                </span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tên phim */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tên Phim
                </label>
                <input
                  type="text"
                  name="ten_phim"
                  value={formData.ten_phim}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              {/* Tên Khác */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tên Khác
                </label>
                <input
                  type="text"
                  name="ten_khac"
                  value={formData.ten_khac || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* URL Hình ảnh */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Poster */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Poster
                </label>
                <div className="flex items-center space-x-3">
                  <div className="w-20 h-28 border border-gray-300 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                    {posterPreviewUrl || formData.poster_url ? (
                      <img
                        src={posterPreviewUrl || formData.poster_url}
                        alt="Poster Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(e, setPosterFile, setPosterPreviewUrl)
                      }
                      className="block w-full text-xs text-gray-900 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-300 file:text-gray-800 hover:file:bg-gray-400 transition-colors"
                    />
                    {(posterFile || formData.poster_url) && (
                      <button
                        type="button"
                        onClick={() =>
                          handleClearImage(
                            setPosterFile,
                            setPosterPreviewUrl,
                            "poster_url"
                          )
                        }
                        className="mt-1 text-xs text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={12} />
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Banner
                </label>
                <div className="flex items-center space-x-3">
                  <div className="w-28 h-16 border border-gray-300 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                    {bannerPreviewUrl || formData.banner_url ? (
                      <img
                        src={bannerPreviewUrl || formData.banner_url}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(e, setBannerFile, setBannerPreviewUrl)
                      }
                      className="block w-full text-xs text-gray-900 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-300 file:text-gray-800 hover:file:bg-gray-400 transition-colors"
                    />
                    {(bannerFile || formData.banner_url) && (
                      <button
                        type="button"
                        onClick={() =>
                          handleClearImage(
                            setBannerFile,
                            setBannerPreviewUrl,
                            "banner_url"
                          )
                        }
                        className="mt-1 text-xs text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={12} />
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tiêu đề phim (ten_phim_image) */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tiêu đề Phim (Image)
                </label>
                <div className="flex items-center space-x-3">
                  <div className="w-28 h-16 border border-gray-300 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                    {titleImagePreviewUrl || formData.ten_phim_image ? (
                      <img
                        src={titleImagePreviewUrl || formData.ten_phim_image}
                        alt="Tiêu đề Phim Image Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTitleImageChange}
                      className="block w-full text-xs text-gray-900 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-300 file:text-gray-800 hover:file:bg-gray-400 transition-colors"
                    />
                    {(titleImageFile || formData.ten_phim_image) && (
                      <button
                        type="button"
                        onClick={handleClearTitleImage}
                        className="mt-1 text-xs text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={12} />
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                name="mo_ta"
                value={formData.mo_ta}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Trailer URL
              </label>
              <input
                type="text"
                name="trailer_url"
                value={formData.trailer_url || ""}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Các trường nhỏ gọn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Năm Phát Hành
                </label>
                <input
                  type="number"
                  name="nam_phat_hanh"
                  value={formData.nam_phat_hanh || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quốc Gia
                </label>
                <select
                  name="quoc_gia"
                  value={formData.quoc_gia}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Chọn quốc gia</option>
                  {availableQuocgia.map((qg) => (
                    <option key={qg.slug} value={qg.code}>
                      {qg.ten_quoc_gia}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tình Trạng
                </label>
                <input
                  type="text"
                  name="tinh_trang"
                  value={formData.tinh_trang || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Số Tập
                </label>
                <input
                  type="text"
                  name="so_tap"
                  value={formData.so_tap || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Lượt Xem
                </label>
                <input
                  type="number"
                  name="luot_xem"
                  value={formData.luot_xem || 0}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center mt-3">
              <input
                type="checkbox"
                id="chieu_rap"
                name="chieu_rap"
                checked={formData.chieu_rap}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="chieu_rap"
                className="ml-2 block text-xs font-semibold text-gray-700"
              >
                Chiếu Rạp
              </label>
            </div>

            {/* Lịch Chiếu Section */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Lịch Chiếu
              </label>
              <div className="space-y-2">
                {formData.lich_chieu.map((lich, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 text-black bg-gray-100 p-2 rounded-lg"
                  >
                    <div className="flex-1">
                      <label className="sr-only">Thứ</label>
                      <select
                        name="thu_trong_tuan"
                        value={lich.thu_trong_tuan}
                        onChange={(e) => {
                          const newLichChieu = [...formData.lich_chieu];
                          newLichChieu[index].thu_trong_tuan = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            lich_chieu: newLichChieu,
                          }));
                        }}
                        className="w-full px-2 py-1 text-sm rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Thứ</option>
                        <option value="2">Thứ 2</option>
                        <option value="3">Thứ 3</option>
                        <option value="4">Thứ 4</option>
                        <option value="5">Thứ 5</option>
                        <option value="6">Thứ 6</option>
                        <option value="7">Thứ 7</option>
                        <option value="8">Chủ Nhật</option>
                      </select>
                    </div>

                    <div className="flex-1 flex items-center space-x-1">
                      <label className="sr-only">Giờ</label>
                      <select
                        name="gio"
                        value={lich.gio_chieu?.split(":")[0] || "00"}
                        onChange={(e) => {
                          const newLichChieu = [...formData.lich_chieu];
                          const [currentHour, currentMinute] =
                            newLichChieu[index].gio_chieu.split(":");
                          newLichChieu[index].gio_chieu = `${e.target.value}:${
                            currentMinute || "00"
                          }`;
                          setFormData((prev) => ({
                            ...prev,
                            lich_chieu: newLichChieu,
                          }));
                        }}
                        className="w-1/2 px-2 py-1 text-sm rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {Array.from({ length: 24 }, (_, i) =>
                          String(i).padStart(2, "0")
                        ).map((hour) => (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-600">:</span>
                      <select
                        name="phut"
                        value={lich.gio_chieu?.split(":")[1] || "00"}
                        onChange={(e) => {
                          const newLichChieu = [...formData.lich_chieu];
                          const [currentHour, currentMinute] =
                            newLichChieu[index].gio_chieu.split(":");
                          newLichChieu[index].gio_chieu = `${
                            currentHour || "00"
                          }:${e.target.value}`;
                          setFormData((prev) => ({
                            ...prev,
                            lich_chieu: newLichChieu,
                          }));
                        }}
                        className="w-1/2 px-2 py-1 text-sm rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {Array.from({ length: 60 }, (_, i) =>
                          String(i).padStart(2, "0")
                        ).map((minute) => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpdateSingleLichChieu(index)}
                      disabled={updatingLichChieuIndex === index}
                      className="text-white hover:scale-105 duration-200 transition-full p-1 bg-blue-600 rounded-lg"
                      title="Cập nhật lịch chiếu"
                    >
                      {updatingLichChieuIndex === index ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Check size={20} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveLichChieu(index, lich.thu_trong_tuan)
                      }
                      className="text-white hover:scale-105 duration-200 transition-full p-1 bg-red-600 rounded-lg"
                      title="Xóa lịch chiếu"
                    >
                      <Minus size={20} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddLichChieu}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-2"
                >
                  <Plus size={16} />
                  Thêm lịch chiếu
                </button>
              </div>
            </div>

            {/* Thể loại */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Thể Loại
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTheloai.map((tl) => (
                  <button
                    key={tl.slug}
                    type="button"
                    onClick={() => handleCheckboxChange(tl.slug)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                      ${
                        formData.the_loai.includes(tl.slug)
                          ? "bg-gray-900 text-white shadow-md"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                  >
                    {tl.ten}
                  </button>
                ))}
              </div>
            </div>

            {/* Đạo diễn & Diễn viên */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Đạo diễn
                </label>
                <input
                  type="text"
                  name="dao_dien"
                  value={formData.dao_dien || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Diễn viên (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  name="dien_vien"
                  value={dienVienInput}
                  onChange={handleDienVienChange}
                  placeholder="Nhập tên diễn viên, cách nhau bằng dấu phẩy"
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-sm rounded-full bg-gray-200 text-gray-800 font-semibold border border-gray-300 hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 text-sm rounded-full bg-gray-900 text-white font-semibold flex items-center gap-2 hover:bg-black transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Cập Nhật</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditMovieModal;
