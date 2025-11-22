import React, { useState } from "react";
import { Search, Plus, Minus, Settings } from "lucide-react";
import { useToast } from "./ToastProvider";

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;

const UserPointsManagement = () => {
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [action, setAction] = useState("add");
    const [amount, setAmount] = useState(0);
    const [reason, setReason] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            showToast("Vui lòng nhập tên người dùng hoặc email", "warning");
            return;
        }

        setIsSearching(true);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(
                `${API_BASE_URL}/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) throw new Error("Search failed");

            const users = await res.json();
            setSearchResults(users);

            if (users.length === 0) {
                showToast("Không tìm thấy người dùng", "info");
            }
        } catch (error) {
            showToast("Lỗi khi tìm kiếm người dùng", "error");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedUser) {
            showToast("Vui lòng chọn người dùng", "warning");
            return;
        }

        if (amount <= 0) {
            showToast("Số điểm phải lớn hơn 0", "warning");
            return;
        }

        if (!reason.trim()) {
            showToast("Vui lòng nhập lý do", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_BASE_URL}/api/admin/users/points`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    user_id: selectedUser.id,
                    action,
                    amount: parseInt(amount),
                    reason,
                }),
            });

            if (!res.ok) throw new Error("Update failed");

            const result = await res.json();
            showToast(result.message, "success");

            // Update selected user points in UI
            setSelectedUser({ ...selectedUser, points: result.new_points });

            // Update in search results too
            setSearchResults(
                searchResults.map((u) =>
                    u.id === selectedUser.id ? { ...u, points: result.new_points } : u
                )
            );

            // Reset form
            setAmount(0);
            setReason("");
        } catch (error) {
            showToast("Lỗi khi cập nhật điểm", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Quản Lý Điểm Người Dùng</h1>

            {/* Search Section */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
                <h2 className="text-lg font-medium text-white mb-4">Tìm Kiếm Người Dùng</h2>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Nhập tên người dùng hoặc email..."
                            className="w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-sky-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors disabled:opacity-50"
                    >
                        {isSearching ? "Đang tìm..." : "Tìm kiếm"}
                    </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                        {searchResults.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className={`p-3 rounded cursor-pointer transition-colors ${selectedUser?.id === user.id
                                    ? "bg-sky-600"
                                    : "bg-gray-900 hover:bg-gray-700"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.anh_dai_dien_url || "/default-avatar.png"}
                                        alt={user.username}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div className="flex-1">
                                        <div className="text-white font-medium">{user.username}</div>
                                        <div className="text-sm text-gray-400">{user.email}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sky-400 font-bold">{user.points || 0}</div>
                                        <div className="text-xs text-gray-400">điểm</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Update Points Section */}
            {selectedUser && (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-lg font-medium text-white mb-4">
                        Cập Nhật Điểm: {selectedUser.username}
                    </h2>
                    <div className="mb-4 p-3 bg-gray-900 rounded">
                        <div className="text-sm text-gray-400">Điểm hiện tại:</div>
                        <div className="text-2xl font-bold text-sky-400">{selectedUser.points || 0}</div>
                    </div>

                    {selectedUser && selectedUser.latest_premium_request_image && (
                        <div className="mb-4 p-3 bg-gray-900 rounded border border-yellow-500/30">
                            <h3 className="text-sm font-medium text-yellow-400 mb-2">Yêu cầu Premium mới nhất</h3>
                            <div className="relative group">
                                <img
                                    src={selectedUser.latest_premium_request_image}
                                    alt="Payment Proof"
                                    className="w-full max-h-60 object-contain rounded bg-black/50"
                                />
                                <a
                                    href={selectedUser.latest_premium_request_image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium"
                                >
                                    Xem ảnh gốc
                                </a>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Action Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Hành động
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAction("add")}
                                    className={`p-3 rounded flex flex-col items-center gap-2 transition-colors ${action === "add"
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-900 text-gray-400 hover:bg-gray-700"
                                        }`}
                                >
                                    <Plus size={20} />
                                    <span className="text-sm">Thêm điểm</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAction("minus")}
                                    className={`p-3 rounded flex flex-col items-center gap-2 transition-colors ${action === "minus"
                                        ? "bg-red-600 text-white"
                                        : "bg-gray-900 text-gray-400 hover:bg-gray-700"
                                        }`}
                                >
                                    <Minus size={20} />
                                    <span className="text-sm">Trừ điểm</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAction("set")}
                                    className={`p-3 rounded flex flex-col items-center gap-2 transition-colors ${action === "set"
                                        ? "bg-sky-600 text-white"
                                        : "bg-gray-900 text-gray-400 hover:bg-gray-700"
                                        }`}
                                >
                                    <Settings size={20} />
                                    <span className="text-sm">Đặt điểm</span>
                                </button>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {action === "set" ? "Số điểm mới" : "Số điểm"}
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                required
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-sky-500 outline-none"
                            />
                            {action !== "set" && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {action === "add"
                                        ? `Điểm sau khi thêm: ${(selectedUser.points || 0) + parseInt(amount || 0)}`
                                        : `Điểm sau khi trừ: ${Math.max(0, (selectedUser.points || 0) - parseInt(amount || 0))}`}
                                </p>
                            )}
                        </div>

                        {/* Reason Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Lý do (sẽ được gửi thông báo cho người dùng)
                            </label>

                            {/* Suggested Reasons */}
                            <div className="mb-3">
                                <p className="text-xs text-gray-400 mb-2">Gợi ý lý do thông báo:</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Thưởng điểm tham gia sự kiện",
                                        "Thưởng điểm hoạt động tích cực",
                                        "Phạt vi phạm quy định",
                                        "Điều chỉnh điểm hệ thống",
                                        "Thưởng đóng góp nội dung",
                                        "Hoàn điểm giao dịch",
                                        "Cập nhật số dư sai só từ hệ thống cũ",
                                        "Chúc mừng bạn đạt danh hiệu 'Trưởng Trạm'. Đây là quà thưởng thăng hạng",
                                        "Quà tri ân Fan Cứng tháng này của Trạm Phim. Cảm ơn bạn đã đồng hành",
                                        "🎉Chúc mừng bạn thắng Minigame",
                                        "Hoàn tác: Hủy giao dịch đổi quà theo yêu cầu",
                                        "Mua tài khoản Youtube Premium thành công, bạn được hoàn 15.000 điểm"
                                    ].map((suggestion, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => setReason(suggestion)}
                                            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-sky-600 text-gray-300 hover:text-white rounded transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                                rows="3"
                                placeholder="Ví dụ: Thưởng điểm tham gia sự kiện..."
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-sky-500 outline-none resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? "Đang cập nhật..." : "Cập nhật điểm"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default UserPointsManagement;
