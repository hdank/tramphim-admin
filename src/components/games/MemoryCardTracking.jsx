import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, RefreshCw } from "lucide-react";
import { useToast } from "../ToastProvider";

const GAME_API_URL = import.meta.env.PUBLIC_GAME_API_URL;

const MemoryCardTracking = () => {
    const { showToast } = useToast();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${GAME_API_URL}/admin/stats`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
            showToast("Lỗi khi tải thống kê", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6 text-white">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <a href="/games" className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-400" />
                    </a>
                    <h1 className="text-2xl font-bold text-white">Thống Kê Memory Card Game</h1>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <RefreshCw size={18} /> Làm mới
                </button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Tổng số lượt chơi</h3>
                    <p className="text-3xl font-bold text-white">{stats?.total_games || 0}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Người chơi duy nhất</h3>
                    <p className="text-3xl font-bold text-white">{stats?.total_players || 0}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Điểm trung bình</h3>
                    <p className="text-3xl font-bold text-sky-400">{Math.round(stats?.avg_score || 0)}</p>
                </div>
            </div>

            {/* Recent Matches Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-white">Lịch sử đấu gần đây</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-900/50 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Thời gian</th>
                                <th className="px-6 py-4">Người chơi</th>
                                <th className="px-6 py-4">Level</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Điểm</th>
                                <th className="px-6 py-4 text-right">Thời gian (s)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {stats?.recent_games?.map((game) => (
                                <tr key={game.id} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        {new Date(game.created_at).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white">
                                        {game.player_email || "Anonymous"}
                                    </td>
                                    <td className="px-6 py-4">
                                        {/* Level ID is shown, ideally we fetch level name or include it in response */}
                                        Level {game.level_id || "?"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${game.game_over
                                            ? (game.matches_found > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")
                                            : "bg-yellow-500/20 text-yellow-400"
                                            }`}>
                                            {game.game_over ? (game.matches_found > 0 ? "Hoàn thành" : "Thất bại") : "Đang chơi"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-white">
                                        {game.final_score || game.score || 0}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {game.time_taken ? Math.round(game.time_taken) : "-"}
                                    </td>
                                </tr>
                            ))}
                            {(!stats?.recent_games || stats.recent_games.length === 0) && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        Chưa có dữ liệu trận đấu nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MemoryCardTracking;
