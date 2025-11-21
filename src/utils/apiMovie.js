import { BASE_API_URL } from "../config/api";

// Cấu hình fetch cơ bản để tránh lặp lại
const defaultFetchOptions = {
  headers: {
    "Content-Type": "application/json",
  },
  // Dùng 'no-cache' cho các request quản lý để đảm bảo dữ liệu mới nhất
  cache: "no-cache",
};

// ------------------------------------------------------------------
// 1. Hàm fetchAllMovieData (Đã chỉnh sửa từ yêu cầu trước)
// ------------------------------------------------------------------
export const fetchAllMovieData = async (phimSlug) => {
  const buildUrl = (lang, server) =>
    `${BASE_API_URL}/phim/${phimSlug}/${lang}/?server=${server}`;

  const urls = [
    buildUrl("vietsub", "sv1"),
    buildUrl("vietsub", "sv2"),
    buildUrl("vietsub", "sv3"),
    buildUrl("thuyetminh", "sv1"),
    buildUrl("thuyetminh", "sv2"),
    buildUrl("thuyetminh", "sv3"),
  ];

  try {
    const responses = await Promise.all(
      urls.map((url) => fetch(url, { ...defaultFetchOptions, method: "GET" }))
    );

    for (const response of responses) {
      if (!response.ok) {
        // Đọc text response để debug tốt hơn
        const errorBody = await response.text();
        throw new Error(
          `Lỗi HTTP ${response.status} khi fetch dữ liệu: ${errorBody}`
        );
      }
    }

    const dataPromises = responses.map((response) => response.json());
    const [
      vietsubSv1Data,
      vietsubSv2Data,
      vietsubSv3Data,
      thuyetminhSv1Data,
      thuyetminhSv2Data,
      thuyetminhSv3Data,
    ] = await Promise.all(dataPromises);

    return {
      ten_phim: phimSlug,
      slug: phimSlug,
      vietsub: {
        sv1: vietsubSv1Data,
        sv2: vietsubSv2Data,
        sv3: vietsubSv3Data,
      },
      thuyetminh: {
        sv1: thuyetminhSv1Data,
        sv2: thuyetminhSv2Data,
        sv3: thuyetminhSv3Data,
      },
    };
  } catch (error) {
    console.error("Lỗi khi fetch dữ liệu phim:", error);
    throw error;
  }
};

// ------------------------------------------------------------------
// 2. Hàm searchMovies (Thiếu trong code bạn cung cấp, cần được thêm vào)
// ------------------------------------------------------------------
export const searchMovies = async (query) => {
  const apiUrl = `${BASE_API_URL}/search/?q=${encodeURIComponent(query)}`;

  const response = await fetch(apiUrl, {
    ...defaultFetchOptions,
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Lỗi HTTP ${response.status} khi tìm kiếm phim.`);
  }

  return await response.json();
};

// ------------------------------------------------------------------
// 3. Hàm deleteEpisode (Đã sửa để dùng fetch và được export)
// ------------------------------------------------------------------
export const deleteEpisode = async (episode, server) => {
  // Đảm bảo episode.tap_phim.phim tồn tại trước khi truy cập slug
  const phimSlug = episode?.tap_phim?.phim?.slug;
  const soTap = episode?.tap_phim?.so_tap;
  const ngonNgu = episode?.ngon_ngu;

  if (!phimSlug || !soTap || !ngonNgu) {
    throw new Error("Thông tin tập phim không đầy đủ để xóa.");
  }

  const apiUrl = `${BASE_API_URL}/phim/${phimSlug}/tap/${soTap}/delete/?server=${server}&ngon_ngu=${ngonNgu}`;

  const response = await fetch(apiUrl, {
    method: "DELETE",
    ...defaultFetchOptions, // Gửi headers cần thiết
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lỗi Response khi xóa tập:", errorText);
    throw new Error(`Xóa tập phim thất bại với HTTP status ${response.status}`);
  }

  // Nếu thành công (thường là status 204 No Content), không cần trả về gì
};
