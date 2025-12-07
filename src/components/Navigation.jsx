import React, { useState, useEffect } from "react";
import {
  Clapperboard,
  PlusCircle,
  List,
  Globe,
  Image,
  Calendar,
  LogOut,
  Film,
  Menu,
  X,
  Gamepad2,
  Coins,
  Smartphone,
} from "lucide-react";

const Navigation = () => {
  const [activePath, setActivePath] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActivePath(window.location.pathname);

      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          setIsMenuOpen(false);
        }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const menuItems = [
    { href: "/danh-sach-phim/trang-1", icon: Clapperboard, label: "Danh sách phim" },
    { href: "/them-phim", icon: PlusCircle, label: "Thêm Phim" },
    { href: "/the-loai", icon: List, label: "Thể loại" },
    { href: "/quoc-gia", icon: Globe, label: "Quốc Gia" },
    { href: "/banner", icon: Image, label: "Banner" },
    { href: "/lich-chieu", icon: Calendar, label: "Lịch Chiếu" },
    { href: "/chu-de", icon: Calendar, label: "Chủ Đề" },
    { href: "/games", icon: Gamepad2, label: "Quản lý Game" },
    { href: "/quan-ly-diem", icon: Coins, label: "Quản lý Điểm" },
    { href: "/ung-dung", icon: Smartphone, label: "Quản lý App" },
    { href: "/doi-mat-khau", icon: Calendar, label: "Đổi mật khẩu" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    document.cookie =
      "loggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
  };

  const handleMenuItemClick = (href) => {
    setActivePath(href);
    if (window.innerWidth < 1024) {
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  return (
    <>
      <div className="lg:hidden fixed top-4 right-4 z-[90]">
        <button
          onClick={toggleMenu}
          className="p-2 bg-gray-800 text-white rounded-lg shadow-lg hover:bg-gray-700 transition"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[50] lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-gray-800 text-gray-300 w-64 flex flex-col shadow-xl z-[60] transition-transform duration-300
          ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:z-50`}
      >
        <div className="flex items-center gap-3 p-5 border-b border-gray-700">
          <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center">
            <Film size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">ADMIN PANEL</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                data-spa
                onClick={() => handleMenuItemClick(item.href)}
                className={`flex items-center gap-3 py-3 px-4 rounded-lg transition ${isActive ? "bg-sky-600 text-white" : "hover:bg-gray-700"
                  }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-700 transition"
          >
            <LogOut size={20} /> <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navigation;