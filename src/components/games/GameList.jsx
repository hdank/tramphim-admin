import React from "react";
import { Gamepad2, Settings, Activity } from "lucide-react";

const GameList = () => {
    const games = [
        {
            id: "memory-card",
            name: "Memory Card Game",
            description: "Trò chơi lật bài ghi nhớ. Người chơi tìm các cặp hình giống nhau.",
            status: "Active",
            icon: Gamepad2,
            configUrl: "/games/memory-card/config",
            trackingUrl: "/games/memory-card/tracking",
        },
        // Add more games here in the future
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-white">Quản Lý Mini Game</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game) => (
                    <div key={game.id} className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:border-sky-500 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-sky-600/20 rounded-lg">
                                <game.icon className="w-8 h-8 text-sky-400" />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${game.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                                }`}>
                                {game.status}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
                        <p className="text-gray-400 text-sm mb-6 min-h-[40px]">{game.description}</p>

                        <div className="flex gap-3">
                            <a
                                href={game.configUrl}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Settings size={16} />
                                Cấu hình
                            </a>
                            <a
                                href={game.trackingUrl}
                                className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Activity size={16} />
                                Thống kê
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GameList;
