import React, { useState, useEffect } from "react";
import {
    Settings,
    BarChart3,
    Trophy,
    Gamepad2,
    Save,
    TestTube,
    AlertCircle,
    CheckCircle,
    Users,
    Star,
    TrendingUp,
} from "lucide-react";

const MiniGameAdmin = () => {
    // Settings state
    const [settings, setSettings] = useState({
        num_pairs: 8,
        time_limit: 0,
        match_points: 10,
        mismatch_penalty: 2,
        time_bonus_enabled: true,
        webhook_url: "",
        webhook_secret: "",
        points_per_win: 10,
        points_per_loss: 2,
    });

    // Stats state
    const [stats, setStats] = useState({
        total_games: 0,
        total_players: 0,
        avg_score: 0,
        avg_moves: 0,
        best_scores: [],
    });

    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [webhookTesting, setWebhookTesting] = useState(false);

    const GAME_API_URL = import.meta.env.PUBLIC_GAME_API_URL;

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchSettings(), fetchStats(), fetchLeaderboard()]);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${GAME_API_URL}/admin/settings`);
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`${GAME_API_URL}/admin/stats`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch(`${GAME_API_URL}/admin/leaderboard`);
            if (response.ok) {
                const data = await response.json();
                setLeaderboard(data);
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });

        try {
            const response = await fetch(`${GAME_API_URL}/admin/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setMessage({
                    type: "success",
                    text: "Đã cập nhật cài đặt thành công!",
                });
                setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            } else {
                throw new Error("Không thể cập nhật cài đặt");
            }
        } catch (error) {
            setMessage({
                type: "error",
                text: `Lỗi: ${error.message}`,
            });
        }
    };

    const handleTestWebhook = async () => {
        if (!settings.webhook_url) {
            setMessage({
                type: "error",
                text: "Vui lòng nhập Webhook URL trước khi test",
            });
            return;
        }

        setWebhookTesting(true);
        setMessage({ type: "", text: "" });

        try {
            const response = await fetch(`${GAME_API_URL}/admin/test-webhook`, {
                method: "POST",
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setMessage({
                        type: "success",
                        text: "Webhook hoạt động tốt! Kết nối thành công.",
                    });
                } else {
                    setMessage({
                        type: "error",
                        text: `Webhook thất bại: ${result.message}`,
                    });
                }
            } else {
                throw new Error("Không thể test webhook");
            }
        } catch (error) {
            setMessage({
                type: "error",
                text: `Lỗi test webhook: ${error.message}`,
            });
        } finally {
            setWebhookTesting(false);
        }
    };

    const updateSetting = (key, value) => {
        setSettings({ ...settings, [key]: value });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-dotted rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm font-semibold text-gray-700">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-light text-gray-900 mb-1">
                        Quản lý Mini Game
                    </h1>
                    <p className="text-sm text-gray-500">
                        Cấu hình webhook, xem thống kê và bảng xếp hạng
                    </p>
                </div>

                {/* Message */}
                {message.text && (
                    <div
                        className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm ${message.type === "error"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-green-100 text-green-700 border border-green-200"
                            }`}
                    >
                        {message.type === "error" ? (
                            <AlertCircle size={18} className="flex-shrink-0" />
                        ) : (
                            <CheckCircle size={18} className="flex-shrink-0" />
                        )}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Gamepad2 className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stats.total_games}</div>
                        <div className="text-sm text-gray-500">Tổng số trận</div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stats.total_players}</div>
                        <div className="text-sm text-gray-500">Tổng người chơi</div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                <Star className="w-5 h-5 text-yellow-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {Math.round(stats.avg_score)}
                        </div>
                        <div className="text-sm text-gray-500">Điểm trung bình</div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {Math.round(stats.avg_moves)}
                        </div>
                        <div className="text-sm text-gray-500">Nước đi TB</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Webhook Configuration */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Settings className="w-4 h-4 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-medium text-gray-900">
                                Cấu hình Webhook
                            </h2>
                        </div>

                        <form onSubmit={handleUpdateSettings} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Webhook URL:
                                </label>
                                <input
                                    type="url"
                                    value={settings.webhook_url || ""}
                                    onChange={(e) => updateSetting("webhook_url", e.target.value)}
                                    className="w-full px-4 py-2.5 text-black bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
                                    placeholder="https://tramphim.com/api/minigame/game-result"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Webhook Secret:
                                </label>
                                <input
                                    type="password"
                                    value={settings.webhook_secret || ""}
                                    onChange={(e) => updateSetting("webhook_secret", e.target.value)}
                                    className="w-full px-4 py-2.5 text-black bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
                                    placeholder="your-secret-key"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Điểm khi thắng:
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={settings.points_per_win}
                                        onChange={(e) => updateSetting("points_per_win", parseInt(e.target.value))}
                                        className="w-full px-4 py-2.5 text-black bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Điểm khi thua:
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={settings.points_per_loss}
                                        onChange={(e) => updateSetting("points_per_loss", parseInt(e.target.value))}
                                        className="w-full px-4 py-2.5 text-black bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 flex justify-center items-center gap-1.5 px-5 py-2.5 font-medium text-sm rounded transition-all shadow-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                                >
                                    <Save size={18} />
                                    Lưu cài đặt
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTestWebhook}
                                    disabled={webhookTesting}
                                    className="flex-1 flex justify-center items-center gap-1.5 px-5 py-2.5 font-medium text-sm rounded transition-all shadow-sm bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <TestTube size={18} />
                                    {webhookTesting ? "Đang test..." : "Test Webhook"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Leaderboard */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                                <Trophy className="w-4 h-4 text-yellow-600" />
                            </div>
                            <h2 className="text-lg font-medium text-gray-900">
                                Bảng xếp hạng ({leaderboard.length})
                            </h2>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {leaderboard.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">
                                    Chưa có người chơi
                                </p>
                            ) : (
                                leaderboard.map((player, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded transition-colors hover:bg-gray-100"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-bold text-blue-600">
                                                    #{index + 1}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {player.player_email || "Ẩn danh"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {player.total_games} trận •{" "}
                                                    {player.best_time ? `${player.best_time.toFixed(1)}s` : "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold text-blue-600 ml-2">
                                            {player.best_score}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Best Scores Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-purple-600" />
                        </div>
                        <h2 className="text-lg font-medium text-gray-900">
                            Điểm số cao nhất
                        </h2>
                    </div>

                    {stats.best_scores.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                            Chưa có trận nào hoàn thành
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                                            Người chơi
                                        </th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-700">
                                            Điểm
                                        </th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-700">
                                            Nước đi
                                        </th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-700">
                                            Thời gian
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.best_scores.map((score, index) => (
                                        <tr
                                            key={index}
                                            className="border-b border-gray-100 hover:bg-gray-50"
                                        >
                                            <td className="py-3 px-4 text-gray-900">
                                                {score.player_name || "Ẩn danh"}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {score.score}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center text-gray-600">
                                                {score.moves}
                                            </td>
                                            <td className="py-3 px-4 text-center text-gray-600">
                                                {score.time ? `${score.time.toFixed(1)}s` : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MiniGameAdmin;
