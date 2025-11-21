import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import EditMovieModal from "./EditMovieModal";
import CrawlModal from "./CrawlModal";
import ThongBaoModal from "./ThongBao"; // Import component mới
import "flag-icons/css/flag-icons.min.css";
import {
  PlusCircle,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Search,
  X,
  Plus,
  Eye,
  Film,
  ArrowDownCircle,
  BellRing, // Icon chuông mới
} from "lucide-react";
import { toast } from "react-toastify";
import { BASE_API_URL } from "../config/api";

const countryCodeMap = {
  my: "us",
  "trung-quoc": "cn",
  "nhat-ban": "jp",
  "an-do": "in",
  phap: "fr",
  anh: "gb",
  nga: "ru",
  duc: "de",
  y: "it",
  "tay-ban-nha": "es",
  uc: "au",
  canada: "ca",
  philippines: "ph",
  indonesia: "id",
  singapore: "sg",
  malaysia: "my",
  "hong-kong": "hk",
  mexico: "mx",
  "dan-mach": "dk",
  "thuy-dien": "se",
  "thuy-si": "ch",
  ukraina: "ua",
  "bo-dao-nha": "pt",
  uae: "ae",
  "dai-loan": "tw",
  "a-rap-xe-ut": "sa",
  "tho-nhi-ky": "tr",
  brazil: "br",
  "nam-phi": "za",
  "na-uy": "no",
  "chau-phi": "xx", // Placeholder for non-specific regions
  "quoc-gia-khac": "xx", // Placeholder for non-specific regions
  "viet-nam": "vn",
  "han-quoc": "kr",
  "thai-lan": "th",
  "au-my": "us", // Âu Mỹ thường dùng cờ Mỹ, có thể tùy chỉnh
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const MovieList = ({ movies = [], breadCrumb = [], pagination }) => {
  const [moviesState, setMoviesState] = useState(movies);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCrawlModal, setShowCrawlModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showThongBaoModal, setShowThongBaoModal] = useState(false); // State cho modal thông báo
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [thongBaoData, setThongBaoData] = useState(null); // State cho data thông báo
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [movieStats, setMovieStats] = useState({
    totalMovies: null,
    updatedToday: null,
  });
  const [availableQuocgia, setAvailableQuocgia] = useState([]);
  const [availableTheloai, setAvailableTheloai] = useState([]);

  const currentPage = pagination?.current_page || 1;
  const totalPages = pagination?.total_pages || 1;

  useEffect(() => {
    setMoviesState(movies);
  }, [movies]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [totalRes, updatedTodayRes, quocGiaRes, theLoaiRes] =
          await Promise.all([
            axios.get(`${BASE_API_URL}/phim/total`),
            axios.get(`${BASE_API_URL}/phim/updated-today`),
            axios.get(`${BASE_API_URL}/quocgia/`),
            axios.get(`${BASE_API_URL}/theloai/`),
          ]);
        setMovieStats({
          totalMovies: totalRes.data.total_phim,
          updatedToday: updatedTodayRes.data.phim_hom_nay,
        });
        setAvailableQuocgia(quocGiaRes.data);
        setAvailableTheloai(theLoaiRes.data);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu thống kê hoặc meta:", error);
        toast.error("Không thể tải dữ liệu thống kê, quốc gia hoặc thể loại.");
      }
    };
    fetchData();
  }, []);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleSearch = useCallback(
    async (query) => {
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
    },
    [BASE_API_URL]
  );

  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch(debouncedSearchTerm);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, handleSearch]);

  const displayedMovies = searchTerm ? searchResults : moviesState;

  if (displayedMovies.length === 0 && !searchTerm) {
    return (
      // ÁP DỤNG STYLE CONTAINER VÀ NỀN TỪ AdminConfigManager
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-[70vh] bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Không có phim nào để hiển thị.
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCrawlModal(true)}
                className="w-full sm:w-auto flex-shrink-0 flex justify-center items-center gap-1.5 px-5 py-2.5 font-medium text-sm rounded transition-all shadow-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
              >
                <Plus size={18} />
                <span>Crawl Phim</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleEditClick = async (slug) => {
    try {
      const apiUrl = `${BASE_API_URL}/phim/${slug}/`;
      const response = await axios.get(apiUrl);
      setEditData({
        phim: response.data,
        meta: {
          available_quocgia: availableQuocgia,
          available_theloai: availableTheloai,
        },
      });
      setShowEditModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu sửa phim:", error);
      toast.error("Có lỗi xảy ra khi lấy dữ liệu phim. Vui lòng thử lại.");
    }
  };

  // Cập nhật hàm này để nhận thêm tên phim
  const handleThongBaoClick = async (slug, tenPhim) => {
    try {
      const response = await axios.get(
        `${BASE_API_URL}/phim/${slug}/thong-bao`
      );
      setThongBaoData({
        slug,
        noidung: response.data.noidung,
        id: response.data.id,
        ten_phim: tenPhim, // Thêm tên phim vào state
      });
      setShowThongBaoModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu thông báo:", error);
      toast.error("Không thể tải thông báo. Vui lòng thử lại.");
    }
  };

  const handleViewClick = async (slug, ten_phim) => {
    try {
      const vietsubSv1Api = `${BASE_API_URL}/phim/${slug}/vietsub/?server=sv1`;
      const vietsubSv2Api = `${BASE_API_URL}/phim/${slug}/vietsub/?server=sv2`;
      const thuyetminhSv1Api = `${BASE_API_URL}/phim/${slug}/thuyetminh/?server=sv1`;
      const thuyetminhSv2Api = `${BASE_API_URL}/phim/${slug}/thuyetminh/?server=sv2`;

      const [vietsubRes1, vietsubRes2, thuyetminhRes1, thuyetminhRes2] =
        await Promise.all([
          axios.get(vietsubSv1Api),
          axios.get(vietsubSv2Api),
          axios.get(thuyetminhSv1Api),
          axios.get(thuyetminhSv2Api),
        ]);

      setViewData({
        slug,
        ten_phim,
        vietsub: {
          server1: vietsubRes1.data,
          server2: vietsubRes2.data,
        },
        thuyetminh: {
          server1: thuyetminhRes1.data,
          server2: thuyetminhRes2.data,
        },
      });
      setShowViewModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu tập phim:", error);
      toast.error("Có lỗi xảy ra khi lấy dữ liệu tập phim. Vui lòng thử lại.");
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditData(null);
  };

  const handleCloseCrawlModal = () => {
    setShowCrawlModal(false);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewData(null);
  };

  const handleCloseThongBaoModal = () => {
    setShowThongBaoModal(false);
    setThongBaoData(null);
  };

  const handleDeleteMovie = async (slug, ten_phim) => {
    toast.info(
      <div className="flex flex-col items-center">
        <p className="mb-2">
          Bạn có chắc chắn muốn xóa phim "{ten_phim}" không?
        </p>
        <div className="flex gap-4">
          <button
            onClick={async () => {
              try {
                const apiUrl = `${BASE_API_URL}/phim/${slug}`;
                await axios.delete(apiUrl);
                setMoviesState(
                  moviesState.filter((movie) => movie.slug !== slug)
                );
                toast.success(`Phim "${ten_phim}" đã được xóa thành công.`);
                toast.dismiss();
              } catch (error) {
                console.error("Lỗi khi xóa phim:", error);
                toast.error("Có lỗi xảy ra khi xóa phim. Vui lòng thử lại.");
                toast.dismiss();
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Xóa
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
          >
            Hủy
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
        draggable: false,
      }
    );
  };

  const handleUpdateMovie = (updatedMovie) => {
    setMoviesState(
      moviesState.map((movie) =>
        movie.slug === updatedMovie.slug ? updatedMovie : movie
      )
    );
  };

  const pageNumbers = [];
  const maxVisiblePages = 3;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    pageNumbers.push(1);
    if (startPage > 2) pageNumbers.push("...");
  }
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pageNumbers.push("...");
    pageNumbers.push(totalPages);
  }

  return (
    // ÁP DỤNG STYLE CONTAINER VÀ NỀN TỪ AdminConfigManager
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <nav className="text-sm text-gray-500 mb-6 w-fit border p-2 rounded-lg">
          {breadCrumb.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="mx-2 text-gray-400">&gt;</span>}
              {crumb.isCurrent ? (
                <span className="text-gray-900 font-medium">{crumb.name}</span>
              ) : (
                <a
                  href={crumb.slug}
                  className="hover:text-red-600 transition-colors duration-150"
                >
                  {crumb.name}
                </a>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Header TƯƠNG ĐỒNG VỚI AdminConfigManager */}
        <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-1">
              Danh Sách Phim
            </h1>
            <p className="text-sm text-gray-500">
              Nhấn vào tên phim để xem chi tiết và chỉnh sửa.
            </p>
          </div>
          <button
            onClick={() => setShowCrawlModal(true)}
            className="w-full sm:w-auto flex-shrink-0 flex justify-center items-center gap-1.5 px-5 py-2.5 font-medium text-sm rounded transition-all shadow-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Crawl Phim</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* ÁP DỤNG STYLE CARD CỦA AdminConfigManager */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">
                Tổng số phim
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {movieStats.totalMovies !== null
                  ? movieStats.totalMovies
                  : "..."}
              </p>
            </div>
            <Film size={48} className="text-gray-300" />
          </div>
          {/* ÁP DỤNG STYLE CARD CỦA AdminConfigManager */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">
                Phim cập nhật hôm nay
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {movieStats.updatedToday !== null
                  ? movieStats.updatedToday
                  : "..."}
              </p>
            </div>
            <ArrowDownCircle size={48} className="text-gray-300" />
          </div>
        </div>

        {/* STYLE INPUT TƯƠNG ĐỒNG VỚI AddConfigForm */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Tìm kiếm phim..."
            className="w-full pl-12 pr-4 py-2.5 text-black bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {isSearching && (
          <div className="text-center text-gray-500 my-8">Đang tìm kiếm...</div>
        )}

        {searchTerm && searchResults.length === 0 && !isSearching && (
          <div className="text-center text-gray-500 my-8">
            Không tìm thấy kết quả nào cho "{searchTerm}".
          </div>
        )}

        {!isSearching && (
          // Card Danh Sách Phim - ÁP DỤNG STYLE CARD CỦA AdminConfigManager
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Film className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-medium text-gray-900">
                Danh Sách Phim ({displayedMovies.length})
              </h2>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {/* Cột đã sắp xếp lại */}
                    <th
                      scope="col"
                      className="table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 tracking-wider"
                    >
                      <span className="flex items-center gap-1">Poster</span>
                    </th>
                    <th
                      scope="col"
                      className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 tracking-wider"
                    >
                      <span className="flex items-center gap-1">Banner</span>
                    </th>
                    <th
                      scope="col"
                      className=" py-4 text-left text-xs font-semibold text-gray-600 tracking-wider"
                    >
                      <span className="flex items-center gap-1">Tên Phim</span>
                    </th>
                    <th
                      scope="col"
                      className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 tracking-wider"
                    >
                      <span className="flex items-center gap-1">Năm</span>
                    </th>
                    <th
                      scope="col"
                      className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 tracking-wider"
                    >
                      <span className="flex items-center gap-1">Loại Phim</span>
                    </th>
                    <th
                      scope="col"
                      className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 tracking-wider"
                    >
                      <span className="flex items-center gap-1">
                        Lịch Chiếu
                      </span>
                    </th>
                    <th
                      scope="col"
                      className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 tracking-wider"
                    >
                      <span className="flex items-center gap-1">
                        Tình Trạng
                      </span>
                    </th>
                    <th
                      scope="col"
                      className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 tracking-wider"
                    >
                      <span className="flex items-center gap-1">Quốc Gia</span>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold text-gray-600 tracking-wider"
                    >
                      Hành Động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedMovies.map((movie) => {
                    const countrySlug = movie.quoc_gia_obj?.code;
                    const countryCode = countryCodeMap[countrySlug];
                    return (
                      <tr
                        key={movie.id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        {/* Dữ liệu đã sắp xếp lại */}
                        <td className="table-cell px-6 py-4">
                          <img
                            src={movie.poster_url}
                            alt={`Poster của phim ${movie.ten_phim}`}
                            className="w-12 h-16 object-cover rounded-md shadow-sm"
                          />
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4">
                          <img
                            src={movie.banner_url}
                            alt={`Banner của phim ${movie.ten_phim}`}
                            className="w-24 h-16 object-cover rounded-md shadow-sm"
                          />
                        </td>
                        <td className="">
                          <div className="flex items-center">
                            <div>
                              <a
                                href={`/phim/${movie.slug}`}
                                className="text-xs lg:text-base text-gray-900 hover:text-red-600 font-semibold transition-colors line-clamp-2"
                              >
                                {movie.ten_phim}
                              </a>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1 ">
                                {movie.ten_khac}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gray-200 text-gray-700">
                            <Calendar
                              size={14}
                              className="mr-1 text-gray-500"
                            />
                            {movie.nam_phat_hanh}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border-gray-300 border">
                            {movie.loai_phim}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {movie.lich_chieu && movie.lich_chieu.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 flex flex-col ">
                              {movie.lich_chieu.map((lich, index) => (
                                <li
                                  key={index}
                                  className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border-gray-300 border"
                                >
                                  <span>
                                    Thứ {lich.thu_trong_tuan} - {lich.gio_chieu}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              Không có lịch
                            </span>
                          )}
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs bg-yellow-300 text-black">
                            <Clock size={14} className="mr-1" />
                            {movie.tinh_trang}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {movie.quoc_gia_obj && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border border-gray-300">
                              {countryCode && (
                                <span
                                  className={`fi fi-${countryCode} mr-1`}
                                ></span>
                              )}
                              {movie.quoc_gia_obj.ten_quoc_gia}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() =>
                                handleThongBaoClick(movie.slug, movie.ten_phim)
                              }
                              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200 group"
                              title="Chỉnh sửa thông báo"
                            >
                              <BellRing
                                size={18}
                                className="text-gray-500 group-hover:text-gray-900"
                              />
                            </button>
                            <button
                              onClick={() => handleEditClick(movie.slug)}
                              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200 group"
                              title="Sửa phim"
                            >
                              <Edit
                                size={18}
                                className="text-gray-500 group-hover:text-gray-900"
                              />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteMovie(movie.slug, movie.ten_phim)
                              }
                              className="text-gray-500 hover:text-red-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200 group"
                              title="Xóa phim"
                            >
                              <Trash2
                                size={18}
                                className="text-gray-500 group-hover:text-red-600"
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isSearching && (
          <div className="flex justify-center items-center space-x-2 mt-10">
            {pageNumbers.map((page, index) => (
              <React.Fragment key={index}>
                {page === "..." ? (
                  <span className="px-4 py-2 text-gray-400">...</span>
                ) : (
                  <a
                    href={`/danh-sach-phim/trang-${page}`}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200
                      ${
                        page === currentPage
                          ? "bg-gray-900 text-white font-bold shadow-md"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                  >
                    {page}
                  </a>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {showEditModal && editData && (
        <EditMovieModal
          editData={editData}
          onClose={handleCloseModal}
          onUpdate={handleUpdateMovie}
        />
      )}

      {showCrawlModal && (
        <CrawlModal
          onClose={handleCloseCrawlModal}
          onCrawlSuccess={() => {
            console.log("Yêu cầu crawl đã được gửi thành công.");
          }}
        />
      )}

      {showThongBaoModal && thongBaoData && (
        <ThongBaoModal
          thongBaoData={thongBaoData}
          onClose={handleCloseThongBaoModal}
        />
      )}

      {showViewModal && viewData && (
        <ViewMovieModal onClose={handleCloseViewModal} viewData={viewData} />
      )}
    </div>
  );
};

export default MovieList;
