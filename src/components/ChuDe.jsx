import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import axios from "axios";
import {
  Search,
  Plus,
  X,
  Film,
  Loader2,
  Trash2,
  Tag,
  List,
  Edit,
  Eye,
  Send, 
} from "lucide-react";

// Thay thế BASE_API_URL bằng đường dẫn API thực tế của bạn
import { BASE_API_URL } from "../config/api";

/**
 * Component quản lý Chủ đề (Bulk Assignment & CRUD).
 */
const ChuDeManager = () => {
  // State chung
  const [activeTab, setActiveTab] = useState("bulk"); // 'bulk' | 'crud'
  const [toastMessage, setToastMessage] = useState(null);

  // State quản lý Chủ đề
  const [chuDeList, setChuDeList] = useState([]);
  const [loadingChuDeList, setLoadingChuDeList] = useState(false);

  // State cho Bulk Assignment
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [selectedChuDe, setSelectedChuDe] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const debounceTimeoutRef = useRef(null);
  
  // State cho Topic CRUD (ĐÃ CẬP NHẬT: Thêm trường slug)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null); // null for create, object for edit
  const [topicForm, setTopicForm] = useState({ ten: "", slug: "", mo_ta: "" });
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [currentViewingTopic, setCurrentViewingTopic] = useState(null);
  const [topicMoviesList, setTopicMoviesList] = useState([]);
  const [loadingTopicMovies, setLoadingTopicMovies] = useState(false);


  // Lấy danh sách slug của phim đã chọn
  const selectedSlugs = useMemo(
    () => selectedMovies.map((p) => p.slug),
    [selectedMovies]
  );
  
  // Toast notification
  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ------------------ CHỦ ĐỀ CORE HANDLERS ------------------
  
  const fetchChuDeList = useCallback(async () => {
    setLoadingChuDeList(true);
    try {
      // API Lấy danh sách Chủ đề: GET /phim/chu-de/
      const response = await axios.get(`${BASE_API_URL}/phim/chu-de/`);
      setChuDeList(response.data);
      
      // Đặt chủ đề đầu tiên làm chủ đề mặc định cho Bulk Assignment
      if (response.data.length > 0 && !selectedChuDe) {
          setSelectedChuDe(response.data[0].slug);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách chủ đề:", err);
      showToast("Lỗi khi tải danh sách chủ đề", "error");
      setChuDeList([]);
    } finally {
      setLoadingChuDeList(false);
    }
  }, [selectedChuDe]);

  useEffect(() => {
    fetchChuDeList();
  }, [fetchChuDeList]);


  // ------------------ PHIM SEARCH HANDLERS (BULK ASSIGNMENT) ------------------

  const fetchMoviesBySearch = useCallback(
    async (query) => {
      if (!query || query.trim() === "") {
        setSearchResults([]);
        return;
      }
      setLoadingSearch(true);
      try {
        // Giả định API tìm kiếm phim vẫn là /search/
        const response = await axios.get(`${BASE_API_URL}/search/`, {
          params: { q: query },
        });
        const newResults = response.data.filter(
          (phim) => !selectedSlugs.includes(phim.slug)
        );
        setSearchResults(newResults);
      } catch (err) {
        console.error("Lỗi khi tìm kiếm phim:", err);
        showToast("Lỗi khi tìm kiếm phim", "error");
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    },
    [selectedSlugs]
  );

  const onSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
        fetchMoviesBySearch(value);
    }, 500);
  };

  const toggleMovieSelection = (phim) => {
    setSelectedMovies((prevSelected) => {
      const isSelected = prevSelected.some((p) => p.id === phim.id);
      if (isSelected) {
        return prevSelected.filter((p) => p.id !== phim.id);
      } else {
        return [...prevSelected, phim];
      }
    });

    setSearchResults((prevResults) =>
      prevResults.filter((p) => p.id !== phim.id)
    );
    setSearchTerm("");
  };

  // ------------------ BULK ACTIONS ------------------

  const handleBulkAddChuDe = async () => {
    if (selectedMovies.length === 0 || !selectedChuDe) {
      showToast("Vui lòng chọn ít nhất một bộ phim và một Chủ đề", "error");
      return;
    }

    setIsAdding(true);
    let successCount = 0;
    let failCount = 0;

    for (const phim of selectedMovies) {
        try {
            // API Thêm phim vào Chủ đề: POST /phim/{phim_slug}/chu-de/{chu_de_slug}/
            await axios.post(
                `${BASE_API_URL}/phim/${phim.slug}/chu-de/${selectedChuDe}/`
            );
            successCount++;
        } catch (err) {
            failCount++;
            console.error(`Lỗi thêm Chủ đề cho phim ${phim.slug}:`, err.response?.data);
        }
    }

    setIsAdding(false);
    setSelectedMovies([]); 

    if (failCount === 0) {
        showToast(`Đã thêm Chủ đề "${selectedChuDe}" thành công cho ${successCount} phim.`);
    } else {
        showToast(
            `Hoàn thành: ${successCount} phim thành công, ${failCount} phim thất bại.`,
            "error"
        );
    }
  };
  
  const handleBulkRemoveChuDe = async () => {
    if (selectedMovies.length === 0 || !selectedChuDe) {
      showToast("Vui lòng chọn ít nhất một bộ phim và một Chủ đề", "error");
      return;
    }

    if (
        !window.confirm(
            `Bạn có chắc chắn muốn XÓA Chủ đề "${selectedChuDe}" khỏi ${selectedMovies.length} phim đã chọn không?`
        )
    ) {
        return;
    }

    setIsRemoving(true);
    let successCount = 0;
    let failCount = 0;

    for (const phim of selectedMovies) {
        try {
            // API Xóa phim khỏi Chủ đề: DELETE /phim/{phim_slug}/chu-de/{chu_de_slug}/
            await axios.delete(
                `${BASE_API_URL}/phim/${phim.slug}/chu-de/${selectedChuDe}/`
            );
            successCount++;
        } catch (err) {
            failCount++;
            console.error(`Lỗi xóa Chủ đề cho phim ${phim.slug}:`, err.response?.data);
        }
    }

    setIsRemoving(false);
    setSelectedMovies([]); 

    if (failCount === 0) {
        showToast(`Đã xóa Chủ đề "${selectedChuDe}" thành công cho ${successCount} phim.`);
    } else {
        showToast(
            `Hoàn thành: ${successCount} phim thành công, ${failCount} phim thất bại.`,
            "error"
        );
    }
  };

  // ------------------ CRUD HANDLERS (ĐÃ CẬP NHẬT) ------------------

  const openModalForCreate = () => {
    setEditingTopic(null);
    setTopicForm({ ten: "", slug: "", mo_ta: "" }); // Thêm slug rỗng
    setIsModalOpen(true);
  };

  const openModalForEdit = (topic) => {
    setEditingTopic(topic);
    setTopicForm({ ten: topic.ten, slug: topic.slug, mo_ta: topic.mo_ta || "" }); // Lấy slug hiện tại
    setIsModalOpen(true);
  };

  const handleSaveTopic = async () => {
    if (!topicForm.ten.trim()) {
        showToast("Tên Chủ đề không được để trống.", "error");
        return;
    }
    
    // VALIDATION CHO SLUG THỦ CÔNG
    if (!topicForm.slug.trim()) {
        showToast("Slug không được để trống.", "error");
        return;
    }
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(topicForm.slug)) {
        showToast("Slug không hợp lệ. Vui lòng chỉ sử dụng chữ thường, số, và dấu gạch ngang (-).", "error");
        return;
    }
    
    setIsSubmittingForm(true);
    const payload = { 
        ten: topicForm.ten, 
        mo_ta: topicForm.mo_ta, 
        slug: topicForm.slug // Dùng slug từ form nhập
    };

    try {
        if (editingTopic) {
            // PUT: Cập nhật Chủ đề. Giả định API chấp nhận slug mới trong body.
            await axios.put(
                `${BASE_API_URL}/phim/chu-de/${editingTopic.slug}/`,
                payload
            );
            showToast(`Cập nhật Chủ đề '${topicForm.ten}' thành công!`);
        } else {
            // POST: Tạo Chủ đề mới
            await axios.post(
                `${BASE_API_URL}/phim/chu-de/`,
                payload
            );
            showToast(`Tạo Chủ đề '${topicForm.ten}' thành công!`);
        }
        
        setIsModalOpen(false);
        setEditingTopic(null);
        await fetchChuDeList(); // Tải lại danh sách

    } catch (err) {
        console.error("Lỗi khi lưu Chủ đề:", err.response?.data || err);
        const detail = err.response?.data?.detail || "Lỗi không xác định";
        showToast(`Lỗi: ${detail}`, "error");
    } finally {
        setIsSubmittingForm(false);
    }
  };

  const handleDeleteTopic = async (topic) => {
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA Chủ đề: "${topic.ten}"? Thao tác này KHÔNG thể hoàn tác!`)) {
        return;
    }

    try {
        // DELETE: Xóa Chủ đề
        await axios.delete(`${BASE_API_URL}/phim/chu-de/${topic.slug}/`);
        showToast(`Xóa Chủ đề '${topic.ten}' thành công!`);
        
        await fetchChuDeList(); // Tải lại danh sách
        if (currentViewingTopic?.slug === topic.slug) {
            setCurrentViewingTopic(null); // Đóng hiển thị phim nếu đang xem topic bị xóa
        }
    } catch (err) {
        console.error("Lỗi khi xóa Chủ đề:", err.response?.data || err);
        const detail = err.response?.data?.detail || "Lỗi không xác định";
        showToast(`Lỗi: ${detail}`, "error");
    }
  };

  const fetchMoviesByTopic = async (topic) => {
    setCurrentViewingTopic(topic);
    setLoadingTopicMovies(true);
    setTopicMoviesList([]);

    try {
        // GET: Lấy danh sách phim theo Chủ đề
        const response = await axios.get(
            `${BASE_API_URL}/phim/chu-de/${topic.slug}/phim/`
        );
        // Giả định API trả về list phim, mỗi phim có ten_phim và slug
        setTopicMoviesList(response.data);
    } catch (err) {
        console.error(`Lỗi khi tải phim theo Chủ đề ${topic.slug}:`, err.response?.data || err);
        showToast("Lỗi khi tải danh sách phim.", "error");
        setTopicMoviesList([]);
    } finally {
        setLoadingTopicMovies(false);
    }
  };
  
  // HÀM MỚI: Xử lý xóa một phim khỏi chủ đề (từ tab CRUD)
  const handleRemoveMovieFromTopic = async (phim_slug, chu_de_slug, phim_ten) => {
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA phim "${phim_ten}" khỏi Chủ đề "${currentViewingTopic.ten}" không?`)) {
        return;
    }

    setLoadingTopicMovies(true); 
    
    try {
        // API Xóa phim khỏi Chủ đề: DELETE /phim/{phim_slug}/chu-de/{chu_de_slug}/
        await axios.delete(
            `${BASE_API_URL}/phim/${phim_slug}/chu-de/${chu_de_slug}/`
        );
        
        showToast(`Đã xóa phim '${phim_ten}' khỏi Chủ đề thành công!`);
        
        // Tải lại danh sách phim cho Chủ đề đó
        // currentViewingTopic không bị null do nó đang được gán
        await fetchMoviesByTopic(currentViewingTopic); 

    } catch (err) {
        console.error(`Lỗi khi xóa phim ${phim_slug} khỏi Chủ đề ${chu_de_slug}:`, err.response?.data);
        const detail = err.response?.data?.detail || "Lỗi không xác định";
        showToast(`Lỗi xóa: ${detail}`, "error");
    } finally {
        setLoadingTopicMovies(false);
    }
};

  // ------------------ RENDER SECTIONS ------------------

  const renderBulkAssignment = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cài đặt Bulk Assignment */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-red-300100 flex items-center justify-center">
              {/* Giữ màu icon này để hợp với design element */}
              <Tag className="w-4 h-4 text-black" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">
              Cài đặt Chủ đề 
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Chọn Chủ đề
              </label>
              <div className="relative">
                <select
                  value={selectedChuDe}
                  onChange={(e) => setSelectedChuDe(e.target.value)}
                  // Chữ input/select màu đen, nền xám nhạt
                  className="w-full px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                  disabled={loadingChuDeList || !chuDeList.length}
                >
                  {loadingChuDeList ? (
                    <option>Đang tải...</option>
                  ) : chuDeList.length === 0 ? (
                    <option>Không có Chủ đề</option>
                  ) : (
                    chuDeList.map((cd) => (
                      <option key={cd.slug} value={cd.slug}>
                        {cd.ten} ({cd.slug})
                      </option>
                    ))
                  )}
                </select>
                {/* Icon chuyển từ text-black sang text-black để hiển thị rõ */}
                <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
              </div>
            </div>

            <div className="flex items-end gap-3 w-fit md:col-span-2">
              <button
                onClick={handleBulkAddChuDe}
                disabled={selectedMovies.length === 0 || isAdding || !selectedChuDe}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  selectedMovies.length === 0 || isAdding || !selectedChuDe
                    ? "bg-gray-300 text-white cursor-not-allowed"
                    : "bg-blue-500 text-white active:scale-[0.98] shadow-sm"
                }`}
              >
                {/* Icon giữ nguyên màu (hoặc để tự động) để hiển thị trên nền indigo */}
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                    <span className="text-black">Đang thêm...</span> 
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span className="text-white">Thêm Phim({selectedMovies.length})</span> 
                  </>
                )}
              </button>
              
              <button
                onClick={handleBulkRemoveChuDe}
                disabled={selectedMovies.length === 0 || isRemoving || !selectedChuDe}
                className={`py-3 px-4  rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 flex-shrink-0 ${
                  selectedMovies.length === 0 || isRemoving || !selectedChuDe
                    ? "bg-gray-300 text-red-400 cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] shadow-sm"
                }`}
              >
                {/* Icon giữ nguyên màu (hoặc để tự động) để hiển thị trên nền đỏ */}
                {isRemoving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
      </div>
      
      {/* Left Column - Search & Selection */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            {/* Icon chuyển từ text-black sang text-black để hiển thị rõ */}
            <Search className="w-5 h-5 text-black" />
            <h3 className="text-base font-medium text-gray-900">
              Tìm kiếm phim
            </h3>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Nhập tên phim..."
              value={searchTerm}
              onChange={onSearchChange}
              // Thêm placeholder-gray-900 để chữ placeholder là màu đen
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border text-gray-900 placeholder-gray-900 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            {/* Icon chuyển từ text-black sang text-black để hiển thị rõ */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loadingSearch ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {/* Đảm bảo text-gray-400 vẫn visible */}
                <span>Đang tìm...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((phim) => (
                  <button
                    key={phim.id}
                    onClick={() => toggleMovieSelection(phim)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 bg-red-30050 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-300100 transition-colors">
                      {/* Icon chuyển từ text-black sang text-black để hiển thị rõ */}
                      <Plus className="w-4 h-4 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {phim.ten_phim}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {phim.slug}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                {/* Đảm bảo text-gray-400 vẫn visible */}
                <span>Không tìm thấy kết quả</span>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">
                {/* Đảm bảo text-gray-400 vẫn visible */}
                <span>Bắt đầu gõ để tìm kiếm</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Selected Movies */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Icon chuyển từ text-black sang text-black để hiển thị rõ */}
            <Film className="w-5 h-5 text-black" />
            <h3 className="text-base font-medium text-gray-900">
              Phim đã chọn
            </h3>
          </div>
          {/* text-black trên nền indigo-50 là visible và đúng ý đồ design */}
          <span className="text-xs font-medium text-black bg-red-30050 px-2.5 py-1 rounded-lg-full">
            {selectedMovies.length} phim
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {selectedMovies.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              {/* Icon chuyển từ text-black sang text-gray-400 cho màu sắc trung tính */}
              <Film className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Chưa chọn phim nào</p>
            </div>
          ) : (
            <div className="space-y-1">
              {selectedMovies.map((phim) => (
                <div
                  key={phim.id}
                  className="flex items-center gap-3 p-3 bg-red-30050 rounded-lg group hover:bg-red-300100 transition-colors"
                >
               
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {phim.ten_phim}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleMovieSelection(phim)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors"
                  >
                    {/* Icon chuyển từ text-black sang text-gray-600, hover vẫn là red-600 */}
                    <X className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTopicCrud = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Danh sách Chủ đề (CRUD) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {/* Icon chuyển từ text-black sang text-black để hiển thị rõ */}
            <List className="w-5 h-5 text-black" />
            <h3 className="text-base font-medium text-gray-900">
              Danh sách Chủ đề ({chuDeList.length})
            </h3>
          </div>
          <button
            onClick={openModalForCreate}
            className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm"
          >
            {/* Icon giữ nguyên màu (hoặc để tự động) để hiển thị trên nền indigo */}
            <Plus className="w-3 h-3" />
            {/* Thêm class text-white để đảm bảo nó hiển thị trên nền indigo */}
            <span className="text-white">Tạo mới</span> 
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
            {loadingChuDeList ? (
                 <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {/* Đảm bảo text-gray-400 vẫn visible */}
                    <span>Đang tải danh sách...</span>
                </div>
            ) : chuDeList.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                    {/* Đảm bảo text-gray-400 vẫn visible */}
                    <span>Không có Chủ đề nào</span>
                </div>
            ) : (
                <div className="space-y-1">
                    {chuDeList.map((topic) => (
                        <div
                            key={topic.id}
                            className={`flex items-center p-3 rounded-lg transition-colors border ${currentViewingTopic?.slug === topic.slug ? 'bg-red-30050 border-indigo-200' : 'bg-white hover:bg-gray-50 border-transparent'}`}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {topic.ten}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {topic.slug}
                                </p>
                            </div>
                            <div className="flex space-x-1 flex-shrink-0">
                                <button
                                    onClick={() => fetchMoviesByTopic(topic)}
                                    title="Xem phim"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-100 transition-colors"
                                >
                                    {/* Icon chuyển từ text-black sang text-gray-600, hover vẫn là green-600 */}
                                    <Eye className="w-4 h-4 text-gray-600 hover:text-green-600" />
                                </button>
                                <button
                                    onClick={() => openModalForEdit(topic)}
                                    title="Chỉnh sửa"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-yellow-100 transition-colors"
                                >
                                    {/* Icon chuyển từ text-black sang text-gray-600, hover vẫn là yellow-600 */}
                                    <Edit className="w-4 h-4 text-gray-600 hover:text-yellow-600" />
                                </button>
                                <button
                                    onClick={() => handleDeleteTopic(topic)}
                                    title="Xóa"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    {/* Icon chuyển từ text-black sang text-gray-600, hover vẫn là red-600 */}
                                    <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
      
      {/* Danh sách Phim theo Chủ đề (ĐÃ THÊM NÚT XÓA TỪNG PHIM) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Icon chuyển từ text-black sang text-black để hiển thị rõ */}
            <Film className="w-5 h-5 text-black" />
            <h3 className="text-base font-medium text-gray-900">
              Phim theo Chủ đề: 
              <span className="ml-2 font-semibold text-black">
                  {currentViewingTopic ? currentViewingTopic.ten : 'Chưa chọn'}
              </span>
            </h3>
          </div>
          {currentViewingTopic && (
            <span className="text-xs font-medium text-black bg-red-30050 px-2.5 py-1 rounded-lg">
                {loadingTopicMovies ? 'Đang tải...' : `${topicMoviesList.length} phim`}
            </span>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
            {currentViewingTopic ? (
                loadingTopicMovies ? (
                    <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        {/* Đảm bảo text-gray-400 vẫn visible */}
                        <span>Đang tải phim...</span>
                    </div>
                ) : topicMoviesList.length > 0 ? (
                    <div className="space-y-1">
                        {topicMoviesList.map((phim) => (
                            <div
                                key={phim.slug}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {/* Icon chuyển từ text-black sang text-gray-600 để hiển thị rõ */}
                                    <Film className="w-4 h-4 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {phim.ten_phim}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {phim.slug}
                                    </p>
                                </div>
                                {/* NÚT XÓA PHIM KHỎI CHỦ ĐỀ HIỆN TẠI */}
                                <button
                                    onClick={() => handleRemoveMovieFromTopic(
                                        phim.slug, 
                                        currentViewingTopic.slug,
                                        phim.ten_phim
                                    )}
                                    title="Xóa phim khỏi Chủ đề này"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors flex-shrink-0"
                                    disabled={loadingTopicMovies}
                                >
                                    <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
                                </button>
                                {/* KẾT THÚC NÚT XÓA */}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400 text-sm">
                        {/* Đảm bảo text-gray-400 vẫn visible */}
                        <span>Chủ đề này chưa có phim nào.</span>
                    </div>
                )
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    {/* Icon chuyển từ text-black sang text-gray-400 cho màu sắc trung tính */}
                    <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Chọn một Chủ đề để xem phim liên quan</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border flex items-center gap-3 animate-slide-in ${
              toastMessage.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${
                toastMessage.type === "error" ? "bg-red-500" : "bg-emerald-500"
              }`}
            >
              {/* Icon giữ nguyên màu text-white */}
              {toastMessage.type === "error" ? (
                <X className="w-3 h-3 text-white" />
              ) : (
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            {/* Thêm class text-gray-900 để đảm bảo chữ là màu đen trên nền sáng */}
            <p className="text-sm font-medium text-gray-900">{toastMessage.message}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-1">
            Quản lý Chủ đề
          </h1>
          <p className="text-sm text-gray-500">
            Tạo, chỉnh sửa, xóa Chủ đề và gán cho phim hàng loạt
          </p>
        </div>
        
       {/* Tab Selector */}
<div className="border-b border-gray-200 mb-6">
  <nav className="flex space-x-4">
    {/* Tab 1 */}
    <button
      onClick={() => setActiveTab('bulk')}
      className={`group flex items-center gap-2 py-2.5 px-4 rounded-lg-t-lg text-sm font-medium transition-all duration-300 ${
        activeTab === 'bulk'
          ? 'bg-red-50 text-red-600 border-b-2 border-red-500 shadow-sm'
          : 'text-gray-600 hover:text-red-600 hover:bg-gray-50 border-b-2 border-transparent'
      }`}
    >
      <Tag
        className={`w-4 h-4 transition-colors duration-300 ${
          activeTab === 'bulk' ? 'text-red-600' : 'text-gray-400 group-hover:text-red-600'
        }`}
      />
      <span>Thêm Phim</span>
    </button>

    {/* Tab 2 */}
    <button
      onClick={() => setActiveTab('crud')}
      className={`group flex items-center gap-2 py-2.5 px-4 rounded-lg-t-lg text-sm font-medium transition-all duration-300 ${
        activeTab === 'crud'
          ? 'bg-red-50 text-red-600 border-b-2 border-red-500 shadow-sm'
          : 'text-gray-600 hover:text-red-600 hover:bg-gray-50 border-b-2 border-transparent'
      }`}
    >
      <List
        className={`w-4 h-4 transition-colors duration-300 ${
          activeTab === 'crud' ? 'text-red-600' : 'text-gray-400 group-hover:text-red-600'
        }`}
      />
      <span>Danh sách Chủ đề</span>
    </button>
  </nav>
</div>

        {/* Tab Content */}
        {activeTab === 'bulk' && renderBulkAssignment()}
        {activeTab === 'crud' && renderTopicCrud()}
      </div>
      
      {/* Modal cho Create/Edit Chủ đề (ĐÃ CẬP NHẬT: Thêm trường slug) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 opacity-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                        {editingTopic ? `Chỉnh sửa Chủ đề: ${editingTopic.ten}` : "Tạo Chủ đề mới"}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        {/* Icon chuyển từ text-black sang text-gray-400 để hiển thị rõ */}
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveTopic(); }}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên Chủ đề *</label>
                        <input
                            type="text"
                            value={topicForm.ten}
                            onChange={(e) => setTopicForm({ ...topicForm, ten: e.target.value })}
                            // Thêm placeholder-gray-900
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 placeholder-gray-900" 
                            required
                            placeholder="Ví dụ: Phim Lãng Mạn, Phim Hành Động 18+"
                            disabled={isSubmittingForm}
                        />
                    </div>
                    
                    {/* INPUT CHO SLUG TỰ NHẬP */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Đường dẫn) *</label>
                        <input
                            type="text"
                            value={topicForm.slug}
                            // Tự động chuyển đổi sang chữ thường và thay thế khoảng trắng bằng dấu gạch ngang khi gõ
                            onChange={(e) => setTopicForm({ ...topicForm, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                            // Thêm placeholder-gray-900
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono text-gray-900 placeholder-gray-900" 
                            required
                            placeholder="vi-du-phim-hanh-dong"
                            disabled={isSubmittingForm}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Slug phải là chữ thường, không dấu, không khoảng trắng, chỉ dùng dấu gạch ngang (-).
                        </p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (Optional)</label>
                        <textarea
                            value={topicForm.mo_ta}
                            onChange={(e) => setTopicForm({ ...topicForm, mo_ta: e.target.value })}
                            rows="3"
                            // Thêm placeholder-gray-900
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 placeholder-gray-900" 
                            placeholder="Mô tả ngắn về chủ đề này"
                            disabled={isSubmittingForm}
                        ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            disabled={isSubmittingForm}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors flex items-center gap-2 ${
                                isSubmittingForm ? 'bg-red-300400 cursor-not-allowed' : 'bg-red-300600 hover:bg-red-300700'
                            }`}
                            disabled={isSubmittingForm}
                        >
                            {/* Icon giữ nguyên màu (hoặc để tự động) để hiển thị trên nền indigo */}
                            {isSubmittingForm ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {/* Giữ text-white vì trên nền indigo */}
                                    <span className="text-white">Đang lưu...</span> 
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    {/* Giữ text-white vì trên nền indigo */}
                                    <span className="text-black">{editingTopic ? 'Cập nhật' : 'Tạo mới'}</span> 
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Style cho animation */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChuDeManager;