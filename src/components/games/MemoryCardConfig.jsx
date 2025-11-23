import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Upload, ArrowLeft, X, Settings } from "lucide-react";
import { useToast } from "../ToastProvider";

const GAME_API_URL = import.meta.env.PUBLIC_GAME_API_URL;

const LevelItem = ({ level, onSave, onDelete }) => {
    const [data, setData] = useState(level);
    const [isEditing, setIsEditing] = useState(false);

    const handleChange = (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setData({ ...data, [e.target.name]: value });
    };

    const handleSave = () => {
        onSave(data);
        setIsEditing(false);
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-400 mb-1">Tên Level</label>
                <input
                    name="name"
                    value={data.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white disabled:opacity-50"
                />
            </div>
            <div className="w-24">
                <label className="block text-xs text-gray-400 mb-1">Số cặp thẻ</label>
                <input
                    type="number"
                    name="card_count"
                    value={data.card_count}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white disabled:opacity-50"
                />
            </div>
            <div className="w-24">
                <label className="block text-xs text-gray-400 mb-1">Thời gian (s)</label>
                <input
                    type="number"
                    name="time_limit"
                    value={data.time_limit || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white disabled:opacity-50"
                />
            </div>
            <div className="w-24">
                <label className="block text-xs text-gray-400 mb-1">Điểm thưởng</label>
                <input
                    type="number"
                    name="points_reward"
                    value={data.points_reward}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white disabled:opacity-50"
                />
            </div>
            <div className="w-24">
                <label className="block text-xs text-gray-400 mb-1">Điểm phạt</label>
                <input
                    type="number"
                    name="points_penalty"
                    value={data.points_penalty}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white disabled:opacity-50"
                />
            </div>
            <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        name="is_active"
                        checked={data.is_active}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-sky-600"
                    />
                    <span className="text-sm text-gray-300">Active</span>
                </label>
            </div>

            <div className="flex items-center gap-2 pt-5 ml-auto">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="p-2 bg-green-600 text-white rounded hover:bg-green-500">
                            <Save size={18} />
                        </button>
                        <button onClick={() => { setData(level); setIsEditing(false); }} className="p-2 bg-gray-600 text-white rounded hover:bg-gray-500">
                            <X size={18} />
                        </button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="p-2 bg-sky-600 text-white rounded hover:bg-sky-500">
                        <Settings size={18} />
                    </button>
                )}
                <button onClick={() => onDelete(level.id)} className="p-2 bg-red-600 text-white rounded hover:bg-red-500">
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};

const MemoryCardConfig = () => {
    const { showToast } = useToast();
    const [levels, setLevels] = useState([]);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("levels"); // levels | images | settings
    const [settings, setSettings] = useState({ webhook_url: "", webhook_secret: "" });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch Levels
            const levelsRes = await fetch(`${GAME_API_URL}/admin/levels`);
            if (levelsRes.ok) {
                const levelsData = await levelsRes.json();
                setLevels(levelsData);
            }

            // Fetch Images
            const imagesRes = await fetch(`${GAME_API_URL}/admin/images`);
            if (imagesRes.ok) {
                const imagesData = await imagesRes.json();
                setImages(imagesData);
            }

            // Fetch Settings
            const settingsRes = await fetch(`${GAME_API_URL}/admin/settings`);
            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                setSettings(settingsData);
            }
        } catch (error) {
            console.error("Error fetching config:", error);
            showToast("Lỗi khi tải cấu hình game", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLevel = async (level) => {
        try {
            const url = level.id
                ? `${GAME_API_URL}/admin/levels/${level.id}`
                : `${GAME_API_URL}/admin/levels`;

            const method = level.id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(level),
            });

            if (!res.ok) throw new Error("Failed to save level");

            showToast("Lưu level thành công", "success");
            fetchData();
        } catch (error) {
            showToast("Lỗi khi lưu level", "error");
        }
    };

    const handleDeleteLevel = async (id) => {
        if (!confirm("Bạn có chắc muốn xóa level này?")) return;
        try {
            const res = await fetch(`${GAME_API_URL}/admin/levels/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            showToast("Xóa level thành công", "success");
            fetchData();
        } catch (error) {
            showToast("Lỗi khi xóa level", "error");
        }
    };

    const handleUploadImage = async (e) => {
        // Implement image upload logic here
        // For now, just a placeholder as we need an upload endpoint that accepts files
        // Or we can use a URL input
        showToast("Tính năng upload ảnh đang phát triển", "info");
    };

    const handleAddImageByUrl = async (url, name) => {
        try {
            const res = await fetch(`${GAME_API_URL}/admin/images`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, name, is_active: true })
            });
            if (!res.ok) throw new Error("Failed to add image");
            showToast("Thêm ảnh thành công", "success");
            fetchData();
        } catch (error) {
            showToast("Lỗi khi thêm ảnh", "error");
        }
    }

    const handleDeleteImage = async (id) => {
        if (!confirm("Bạn có chắc muốn xóa ảnh này?")) return;
        try {
            const res = await fetch(`${GAME_API_URL}/admin/images/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            showToast("Xóa ảnh thành công", "success");
            fetchData();
        } catch (error) {
            showToast("Lỗi khi xóa ảnh", "error");
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${GAME_API_URL}/admin/settings?webhook_url=${encodeURIComponent(settings.webhook_url)}&webhook_secret=${encodeURIComponent(settings.webhook_secret)}`, {
                method: 'PUT'
            });
            if (!res.ok) throw new Error('Failed to save settings');
            showToast("Lưu cài đặt thành công", "success");
            fetchData();
        } catch (error) {
            showToast("Lỗi khi lưu cài đặt", "error");
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <a href="/games" className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-400" />
                </a>
                <h1 className="text-2xl font-bold text-white">Cấu Hình Memory Card Game</h1>
            </div>

            <div className="flex gap-4 mb-6 border-b border-gray-700">
                <button
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "levels"
                        ? "text-sky-400 border-b-2 border-sky-400"
                        : "text-gray-400 hover:text-white"
                        }`}
                    onClick={() => setActiveTab("levels")}
                >
                    Levels
                </button>
                <button
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "images"
                        ? "text-sky-400 border-b-2 border-sky-400"
                        : "text-gray-400 hover:text-white"
                        }`}
                    onClick={() => setActiveTab("images")}
                >
                    Hình Ảnh Thẻ
                </button>
                <button
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "settings"
                        ? "text-sky-400 border-b-2 border-sky-400"
                        : "text-gray-400 hover:text-white"
                        }`}
                    onClick={() => setActiveTab("settings")}
                >
                    Cài Đặt Webhook
                </button>
            </div>

            {activeTab === "levels" && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                // Add new empty level to list for editing
                                const newLevel = { name: "New Level", card_count: 8, time_limit: 60, points_reward: 10, points_penalty: 5, is_active: true };
                                handleSaveLevel(newLevel);
                            }}
                            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus size={18} /> Thêm Level
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {levels.map((level) => (
                            <LevelItem
                                key={level.id}
                                level={level}
                                onSave={handleSaveLevel}
                                onDelete={handleDeleteLevel}
                            />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "images" && (
                <div className="space-y-6">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <h3 className="text-lg font-medium text-white mb-4">Upload Hình Ảnh Thẻ</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData();
                            const fileInput = e.target.querySelector('input[type="file"]');

                            if (fileInput.files.length === 0) {
                                showToast("Vui lòng chọn ít nhất 1 ảnh", "warning");
                                return;
                            }

                            for (let file of fileInput.files) {
                                formData.append('files', file);
                            }

                            try {
                                const res = await fetch(`${GAME_API_URL}/admin/images/upload`, {
                                    method: 'POST',
                                    body: formData
                                });

                                if (!res.ok) throw new Error('Upload failed');

                                const result = await res.json();
                                showToast(result.message, "success");
                                fetchData();
                                e.target.reset();
                            } catch (error) {
                                showToast("Lỗi khi upload ảnh", "error");
                            }
                        }} className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-300">
                                    Chọn nhiều ảnh (PNG, JPG, GIF...)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-500 cursor-pointer"
                                />
                            </div>
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors"
                            >
                                <Upload size={18} />
                                Upload Ảnh
                            </button>
                        </form>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {images.map((img) => (
                            <div key={img.id} className="group relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 aspect-square">
                                <img src={`${GAME_API_URL}${img.url}`} alt={img.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleDeleteImage(img.id)}
                                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                {img.name && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate text-center">
                                        {img.name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "settings" && (
                <div className="space-y-6">
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-2xl">
                        <h3 className="text-lg font-medium text-white mb-4">Cấu Hình Webhook</h3>
                        <p className="text-sm text-gray-400 mb-6">
                            Cấu hình webhook để gửi kết quả game về Trạm Phim backend và cập nhật điểm người dùng.
                        </p>
                        <form onSubmit={handleSaveSettings} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Webhook URL
                                </label>
                                <input
                                    type="url"
                                    value={settings.webhook_url}
                                    onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                                    placeholder="http://localhost:8003/api/minigame/game-result"
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-sky-500 outline-none"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    URL endpoint nhận kết quả game từ game backend
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Webhook Secret
                                </label>
                                <input
                                    type="text"
                                    value={settings.webhook_secret}
                                    onChange={(e) => setSettings({ ...settings, webhook_secret: e.target.value })}
                                    placeholder="your-secret-key"
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-sky-500 outline-none"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Secret key để xác thực webhook (phải khớp với MINIGAME_WEBHOOK_SECRET trong tramphim-backend)
                                </p>
                            </div>
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded transition-colors"
                            >
                                <Save size={18} />
                                Lưu Cài Đặt
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemoryCardConfig;
