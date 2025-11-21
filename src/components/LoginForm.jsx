import React, { useState } from "react";
import { Film, User, Lock, AlertCircle } from "lucide-react";
import { BASE_API_URL } from "../config/api";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await fetch(`${BASE_API_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { access_token, refresh_token } = data;
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        document.cookie = "loggedIn=true; path=/; max-age=604800; samesite=Lax";
        window.location.href = "/danh-sach-phim/trang-1";
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Sai tên đăng nhập hoặc mật khẩu.");
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      setErrorMessage("Đã xảy ra lỗi khi kết nối.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <main className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4">
            <Film className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trang Quản Trị Phim
          </h1>

          <p className="text-gray-600 text-base">
            Hệ thống quản lý phim chuyên nghiệp
          </p>
        </div>
        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng nhập</h2>

            <p className="text-gray-600">Vui lòng nhập thông tin đăng nhập</p>
          </div>

          <div className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Tên người dùng
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                  placeholder="Nhập tên người dùng"
                />
              </div>
            </div>
            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mật khẩu
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <a
                href="/forgot-password"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Quên mật khẩu?
              </a>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />

                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              onClick={handleSubmit}
              className="w-full flex items-center justify-center py-3 px-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? (
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
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <Film className="w-5 h-5 mr-2" />
                  Đăng nhập
                </>
              )}
            </button>
          </div>
          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 Movie Management System
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginForm;
