import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Search } from "lucide-react";

// --- Định nghĩa các kiểu dữ liệu từ API/Backend ---

// Giao diện (Interface) cho dữ liệu gửi lên API POST /phim/
interface PhimCreate {
  ten_phim: string;
  ten_khac?: string | null; // Cập nhật để có thể là null hoặc undefined
  slug: string;
  mo_ta: string;
  tmdb: string; // Giữ là string như trong BaseModel Python
  poster_url?: string | null;
  banner_url?: string | null;
  title_image_url?: string | null;
  nam_phat_hanh: number;
  trailer_url?: string | null;
  ten_phim_image?: string | null;
  quoc_gia?: string | null;
  the_loai: string[];
  loai_phim?: "phim-le" | "phim-bo" | "hoat-hinh";
  so_tap?: string | null;
  tinh_trang?: string | null;
  thoi_luong?: string | null;
  chat_luong?: string | null;
  ngon_ngu?: string | null;
  dao_dien?: string | null;
  dien_vien?: string[] | null; // Cập nhật: string[] hoặc null
  trang_thai?: "dangchieu" | "hoanthanh" | "dangcapnhat";
  luot_xem: number;
  chieu_rap: boolean;
  // Bỏ luot_like, luot_dislike vì có giá trị mặc định trong BaseModel
}

// Định nghĩa kiểu dữ liệu cho Thể loại và Quốc gia từ API
interface TheLoai {
  id: number;
  ten: string;
  slug: string;
}

interface QuocGia {
  id: number;
  ten_quoc_gia: string;
  code: string;
}

// Giả định BASE_API_URL được import đúng
import { BASE_API_URL } from "../config/api";

// Các tùy chọn cho dropdown/select
const trangThaiOptions = ["dangchieu", "hoanthanh", "dangcapnhat"];

// Hàm tiện ích để áp dụng style input/select/textarea đồng bộ
const inputStyle =
  "flex-grow w-full px-4 py-2.5 text-black bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all";

const CreateMovieForm: React.FC = () => {
  // --- STATE KHỞI TẠO ---
  const [formData, setFormData] = useState<PhimCreate>({
    ten_phim: "",
    ten_khac: null, // Khởi tạo là null để phù hợp với Optional[str] = None
    slug: "",
    tmdb: "10.0", // Giữ là string
    mo_ta: "",
    poster_url: null,
    banner_url: null,
    title_image_url: null,
    nam_phat_hanh: new Date().getFullYear(),
    trailer_url: null,
    ten_phim_image: null,
    quoc_gia: "", // Dùng chuỗi rỗng để đại diện cho "chưa chọn" trong <select>
    the_loai: [],
    loai_phim: "phim-le",
    so_tap: null,
    tinh_trang: null,
    thoi_luong: "??",
    chat_luong: "FHD",
    ngon_ngu: "VietSub",
    dao_dien: "Đang cập nhật",
    dien_vien: null, // Khởi tạo là null
    trang_thai: "dangcapnhat",
    luot_xem: 0,
    chieu_rap: false,
  });

  const [loadingForm, setLoadingForm] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [theLoaiList, setTheLoaiList] = useState<TheLoai[]>([]);
  const [quocGiaList, setQuocGiaList] = useState<QuocGia[]>([]);

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [titleImageFile, setTitleImageFile] = useState<File | null>(null);

  // --- useEffect: Fetch dữ liệu cho Select ---
  useEffect(() => {
    const fetchSelectData = async () => {
      try {
        const [theLoaiRes, quocGiaRes] = await Promise.all([
          axios.get<TheLoai[]>(`${BASE_API_URL}/theloai/`),
          axios.get<QuocGia[]>(`${BASE_API_URL}/quocgia/`),
        ]);
        setTheLoaiList(theLoaiRes.data);
        setQuocGiaList(quocGiaRes.data);
      } catch (err) {
        console.error("Failed to fetch select data:", err);
        setError("Không thể tải danh sách thể loại hoặc quốc gia.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchSelectData();
  }, []);

  // --- Hàm xử lý thay đổi input cơ bản ---
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    if (type === "checkbox" && name === "the_loai") {
      const slug = value;
      setFormData((prev) => ({
        ...prev,
        the_loai: checked
          ? [...prev.the_loai, slug]
          : prev.the_loai.filter((item) => item !== slug),
      }));
    } else if (type === "checkbox" && name === "chieu_rap") {
      setFormData((prev) => ({
        ...prev,
        chieu_rap: checked,
      }));
    } else if (type === "file") {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      if (name === "poster_file") {
        setPosterFile(file);
      } else if (name === "banner_file") {
        setBannerFile(file);
      } else if (name === "title_image_file") {
        setTitleImageFile(file);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "nam_phat_hanh" || name === "luot_xem" // Chỉ chuyển đổi số cho nam_phat_hanh và luot_xem
            ? parseInt(value) || 0
            : value === ""
            ? null
            : value, // Chuyển chuỗi rỗng thành null cho các trường Optional
      }));
    }
  };

  // --- Hàm xử lý thay đổi input dạng mảng (Diễn viên) ---
  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Tách chuỗi bằng dấu phẩy, trim khoảng trắng, và loại bỏ các chuỗi rỗng
    const arrayValue = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    setFormData((prev) => ({
      ...prev,
      [name]: arrayValue.length > 0 ? arrayValue : null, // Gửi null nếu mảng rỗng
    }));
  };

  // --- Hàm Tải ảnh lên (Image Upload) ---
  const handleImageUpload = async (
    file: File | null,
    type: "poster" | "banner" | "img"
  ) => {
    if (!file) return null;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    const endpoint = `${BASE_API_URL}/upload/${type}`;

    try {
      const response = await axios.post(endpoint, uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.url;
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      // Không cần setError ở đây, để logic chính xử lý
      return null;
    }
  };

  // --- Hàm Xử lý Gửi Form Chính ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingForm(true);
    setError(null);
    setSuccess(null);

    const processOptionalString = (
      val: string | number | null | undefined
    ): string | null | undefined => {
      if (typeof val === "number") return val;
      return val === "" || val === undefined ? null : val;
    };

    try {
      // 1. Tải lên ảnh Poster, Banner và Title Image
      const posterUrl = await handleImageUpload(posterFile, "poster");
      const bannerUrl = await handleImageUpload(bannerFile, "banner");
      const titleImageUrl = await handleImageUpload(titleImageFile, "img");

      if (posterFile && !posterUrl) {
        throw new Error("Tải lên poster thất bại.");
      }
      if (bannerFile && !bannerUrl) {
        throw new Error("Tải lên banner thất bại.");
      }
      if (titleImageFile && !titleImageUrl) {
        throw new Error("Tải lên title image thất bại.");
      }

      // 2. Chuẩn bị dữ liệu cuối cùng gửi đi (Lưu ý: poster_url, banner_url, và title_image_url ưu tiên từ file upload)
      // Title image: File upload > URL input > null
      const finalTitleImageUrl = titleImageUrl || formData.title_image_url || null;
      
      const finalFormData: PhimCreate = {
        ...formData,
        poster_url: processOptionalString(posterUrl || formData.poster_url),
        banner_url: processOptionalString(bannerUrl || formData.banner_url),
        title_image_url: processOptionalString(finalTitleImageUrl),
        ten_khac: processOptionalString(formData.ten_khac),
        trailer_url: processOptionalString(formData.trailer_url),
        ten_phim_image: processOptionalString(formData.ten_phim_image),
        quoc_gia: processOptionalString(formData.quoc_gia),
        so_tap: processOptionalString(formData.so_tap),
        tinh_trang: processOptionalString(formData.tinh_trang),
        thoi_luong: processOptionalString(formData.thoi_luong),
        chat_luong: processOptionalString(formData.chat_luong),
        ngon_ngu: processOptionalString(formData.ngon_ngu),
        dao_dien: processOptionalString(formData.dao_dien),

        // dien_vien đã được xử lý thành string[] hoặc null trong handleArrayChange
        dien_vien: formData.dien_vien,
      };

      // Đảm bảo tmdb là chuỗi
      finalFormData.tmdb = finalFormData.tmdb
        ? String(finalFormData.tmdb)
        : "0.0";

      // 3. Gửi dữ liệu tạo phim
      const response = await axios.post(`${BASE_API_URL}/phim/`, finalFormData);

      toast.success(`Tạo phim thành công! ID: ${response.data.id}`);
      setSuccess(`Tạo phim thành công! ID: ${response.data.id}`);

      // 4. Reset form về trạng thái ban đầu
      setFormData({
        ten_phim: "",
        ten_khac: null,
        slug: "",
        tmdb: "10.0", // Reset TMDB về giá trị mặc định ban đầu
        mo_ta: "",
        poster_url: null,
        banner_url: null,
        title_image_url: null,
        nam_phat_hanh: new Date().getFullYear(),
        trailer_url: null,
        ten_phim_image: null,
        quoc_gia: "",
        the_loai: [],
        loai_phim: "phim-le",
        so_tap: null,
        tinh_trang: null,
        thoi_luong: "??",
        chat_luong: "FHD",
        ngon_ngu: "VietSub",
        dao_dien: "Đang cập nhật",
        dien_vien: null,
        trang_thai: "dangcapnhat",
        luot_xem: 0,
        chieu_rap: false,
      });
      setPosterFile(null);
      setBannerFile(null);
      setTitleImageFile(null);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      let errorMessage = "Đã có lỗi xảy ra.";

      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        // Xử lý lỗi Pydantic Validation (ví dụ: the_loai không được rỗng)
        errorMessage = `Lỗi nhập liệu: ${detail
          .map((e: any) => `${e.loc.join(".")}: ${e.msg}`)
          .join("; ")}`;
      } else if (detail) {
        // Lỗi HTTPException custom từ API
        errorMessage = detail;
      } else {
        errorMessage = err.message;
      }

      // Xử lý lỗi trùng slug (từ API backend)
      if (errorMessage.includes("Phim với slug này đã tồn tại.")) {
        errorMessage =
          "Lỗi: Slug phim đã tồn tại. Vui lòng chọn một slug khác.";
      }

      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoadingForm(false);
    }
  };

  // --- UI RENDER ---

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:py-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-1">
            Thêm Phim Mới
          </h1>
          <p className="text-sm text-gray-500">
            Điền đầy đủ thông tin để tạo một bộ phim mới.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {success && (
              <div
                className="bg-green-50 border-l-4 border-green-400 text-green-700 p-4 rounded-md"
                role="alert"
              >
                <span className="font-medium">✅ {success}</span>
              </div>
            )}
            {error && (
              <div
                className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md"
                role="alert"
              >
                <span className="font-medium">❌ {error}</span>
              </div>
            )}

            {/* Các trường nhập liệu cơ bản */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col">
                <label
                  htmlFor="ten_phim"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Tên Phim <span className="text-red-500">*</span>
                </label>
                <input
                  id="ten_phim"
                  type="text"
                  name="ten_phim"
                  value={formData.ten_phim}
                  onChange={handleChange}
                  required
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                />
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="slug"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="slug"
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                />
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="tmdb"
                  className="text-sm font-semibold text-gray-700 mb-1 flex items-center justify-between"
                >
                  Điểm TMDB
                  <Search className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-pointer" />
                </label>
                <input
                  id="tmdb"
                  type="text" // Giữ là text vì nó là string trong BaseModel
                  name="tmdb"
                  value={formData.tmdb || ""}
                  onChange={handleChange}
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                  placeholder="Ví dụ: 8.5"
                />
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="ten_khac"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Tên Khác
                </label>
                <input
                  id="ten_khac"
                  type="text"
                  name="ten_khac"
                  value={formData.ten_khac || ""}
                  onChange={handleChange}
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="mo_ta"
                className="text-sm font-semibold text-gray-700 mb-1"
              >
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                id="mo_ta"
                name="mo_ta"
                value={formData.mo_ta}
                onChange={handleChange}
                required
                rows={3}
                // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                className={inputStyle}
              />
            </div>

            {/* Upload File/URL Images */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col">
                <label
                  htmlFor="poster_file"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Poster (File)
                </label>
                <input
                  id="poster_file"
                  type="file"
                  name="poster_file"
                  onChange={handleChange}
                  accept="image/*"
                  className="text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" // Thay màu violet thành blue
                />
                <p className="text-xs text-gray-500 mt-1">
                  {posterFile
                    ? posterFile.name
                    : formData.poster_url || "Chưa có file"}
                </p>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="banner_file"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Banner (File)
                </label>
                <input
                  id="banner_file"
                  type="file"
                  name="banner_file"
                  onChange={handleChange}
                  accept="image/*"
                  className="text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" // Thay màu violet thành blue
                />
                <p className="text-xs text-gray-500 mt-1">
                  {bannerFile
                    ? bannerFile.name
                    : formData.banner_url || "Chưa có file"}
                </p>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="title_image_file"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Title Image (File)
                </label>
                <input
                  id="title_image_file"
                  type="file"
                  name="title_image_file"
                  onChange={handleChange}
                  accept="image/*"
                  className="text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {titleImageFile
                    ? titleImageFile.name
                    : "Chưa có file"}
                </p>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="title_image_url"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Title Image (URL)
                </label>
                <input
                  id="title_image_url"
                  type="text"
                  name="title_image_url"
                  value={formData.title_image_url || ""}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="URL từ CDN hoặc link ngoài"
                />
                <p className="text-xs text-gray-500 mt-1">
                  File upload sẽ ưu tiên hơn URL
                </p>
              </div>
            </div>

            {/* Tên Phim Image (URL) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label
                  htmlFor="ten_phim_image"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Tên Phim Image (URL)
                </label>
                <input
                  id="ten_phim_image"
                  type="text"
                  name="ten_phim_image"
                  value={formData.ten_phim_image || ""}
                  onChange={handleChange}
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                  placeholder="URL của logo/tên phim"
                />
              </div>
            </div>

            {/* Các trường nhập liệu nhỏ gọn và Select */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-6">
              <div className="flex flex-col">
                <label
                  htmlFor="nam_phat_hanh"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Năm phát hành
                </label>
                <input
                  id="nam_phat_hanh"
                  type="number"
                  name="nam_phat_hanh" // Đã sửa từ nam_phim thành nam_phat_hanh
                  value={formData.nam_phat_hanh}
                  onChange={handleChange}
                  required
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="quoc_gia"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Quốc gia
                </label>
                <select
                  id="quoc_gia"
                  name="quoc_gia"
                  value={formData.quoc_gia || ""}
                  onChange={handleChange}
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                >
                  <option value="">-- Chọn Quốc gia --</option>
                  {quocGiaList.map((qg) => (
                    <option key={qg.id} value={qg.code}>
                      {qg.ten_quoc_gia}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="loai_phim"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Loại phim
                </label>
                <select
                  id="loai_phim"
                  name="loai_phim"
                  value={formData.loai_phim}
                  onChange={handleChange}
                  required
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                >
                  <option value="phim-le">Phim Lẻ</option>
                  <option value="phim-bo">Phim Bộ</option>
                  <option value="hoat-hinh">Hoạt Hình</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="trailer_url"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Trailer URL
                </label>
                <input
                  id="trailer_url"
                  type="text"
                  name="trailer_url"
                  value={formData.trailer_url || ""}
                  onChange={handleChange}
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="so_tap"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Số tập
                </label>
                <input
                  id="so_tap"
                  type="text"
                  name="so_tap"
                  value={formData.so_tap || ""}
                  onChange={handleChange}
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                  placeholder="Ví dụ: 1/12"
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="thoi_luong"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Thời lượng
                </label>
                <input
                  id="thoi_luong"
                  type="text"
                  name="thoi_luong"
                  value={formData.thoi_luong || ""}
                  onChange={handleChange}
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                  placeholder="Ví dụ: 90 phút"
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="chat_luong"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Chất lượng
                </label>
                <input
                  id="chat_luong"
                  type="text"
                  name="chat_luong"
                  value={formData.chat_luong || ""}
                  onChange={handleChange}
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                  placeholder="Ví dụ: FHD, HD"
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="ngon_ngu"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Ngôn ngữ
                </label>
                <input
                  id="ngon_ngu"
                  type="text"
                  name="ngon_ngu"
                  value={formData.ngon_ngu || ""}
                  onChange={handleChange}
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                  placeholder="Ví dụ: VietSub, Lồng tiếng"
                />
              </div>
            </div>

            <hr className="my-8 border-gray-300" />

            {/* Danh sách Thể loại (Checkbox) */}
            <div>
              <p className="text-lg font-bold text-gray-800 mb-3">
                Thể loại <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {theLoaiList.map((tl) => (
                  <label
                    key={tl.id}
                    className="flex items-center space-x-2 text-gray-700 cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition duration-150"
                  >
                    <input
                      type="checkbox"
                      name="the_loai"
                      value={tl.slug}
                      checked={formData.the_loai.includes(tl.slug)}
                      onChange={handleChange}
                      className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" // Giảm kích thước checkbox một chút cho gọn
                    />
                    <span className="text-sm font-medium">{tl.ten}</span>
                  </label>
                ))}
              </div>
              {formData.the_loai.length === 0 && (
                <p className="text-red-500 text-sm mt-2">
                  Vui lòng chọn ít nhất một thể loại.
                </p>
              )}
            </div>

            <hr className="my-8 border-gray-300" />

            {/* Thông tin Diễn viên/Trạng thái/Lượt xem */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col col-span-1 md:col-span-2">
                <label
                  htmlFor="dien_vien"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Diễn viên (phân cách bằng dấu phẩy)
                </label>
                <input
                  id="dien_vien"
                  type="text"
                  name="dien_vien"
                  value={
                    formData.dien_vien
                      ? (formData.dien_vien as string[]).join(", ")
                      : ""
                  }
                  onChange={handleArrayChange}
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                  placeholder="Ví dụ: Tom Cruise, Brad Pitt"
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="dao_dien"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Đạo diễn
                </label>
                <input
                  id="dao_dien"
                  type="text"
                  name="dao_dien"
                  value={formData.dao_dien || ""}
                  onChange={handleChange}
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="trang_thai"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Trạng thái
                </label>
                <select
                  id="trang_thai"
                  name="trang_thai"
                  value={formData.trang_thai || ""}
                  onChange={handleChange}
                  required
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                >
                  {trangThaiOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="luot_xem"
                  className="text-sm font-semibold text-gray-700 mb-1"
                >
                  Lượt xem
                </label>
                <input
                  id="luot_xem"
                  type="number"
                  name="luot_xem"
                  value={formData.luot_xem}
                  onChange={handleChange}
                  required
                  // ÁP DỤNG STYLE INPUT ĐỒNG BỘ
                  className={inputStyle}
                />
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <input
                  id="chieu_rap"
                  type="checkbox"
                  name="chieu_rap"
                  checked={formData.chieu_rap}
                  onChange={handleChange}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="chieu_rap"
                  className="text-sm font-semibold text-gray-700"
                >
                  Phim Chiếu Rạp
                </label>
              </div>
            </div>

            <hr className="my-8 border-gray-300" />

            {/* Nút gửi form - ÁP DỤNG STYLE BUTTON CHÍNH ĐỒNG BỘ */}
            <button
              type="submit"
              disabled={loadingForm || loadingData}
              className={`w-full flex justify-center items-center gap-1.5 px-5 py-2.5 font-medium text-sm rounded transition-all shadow-sm ${
                loadingForm || loadingData
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]" // Style đồng bộ
              }`}
            >
              {loadingForm ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang tạo...
                </>
              ) : (
                "Tạo Phim"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateMovieForm;
