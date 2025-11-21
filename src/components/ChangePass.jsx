import React, { useState } from "react";
import { Lock, AlertCircle, CheckCircle, RotateCcw } from "lucide-react";
import { BASE_API_URL } from "../config/api";

const ChangePasswordForm = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword.length < 6) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return false;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return false;
    }

    if (oldPassword === newPassword) {
      setErrorMessage("Mật khẩu mới không được giống mật khẩu cũ.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const accessToken =
      localStorage.getItem("access_token") || "YOUR_JWT_ACCESS_TOKEN_HERE";

    if (!accessToken || accessToken === "YOUR_JWT_ACCESS_TOKEN_HERE") {
      setErrorMessage("Không tìm thấy token. Vui lòng đăng nhập lại.");
      return;
    }

    setIsLoading(true);

    const payload = {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    };

    try {
      const response = await fetch(`${BASE_API_URL}/auth/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessMessage(
          "Đổi mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới ngay bây giờ."
        );
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Đã xảy ra lỗi khi đổi mật khẩu.");
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Responsive container matching the LoginForm style
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4 shadow-xl">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Thay Đổi Mật Khẩu
          </h1>

          <p className="text-gray-600 text-base">
            Bảo mật tài khoản là ưu tiên hàng đầu.
          </p>
        </div>
        {/* Change Password Form Card */}
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Old Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="old-password"
                className="block text-sm font-medium text-gray-700"
              >
                Mật khẩu cũ
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type="password"
                  id="old-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-200"
                  placeholder="Nhập mật khẩu hiện tại"
                  autoComplete="current-password"
                />
              </div>
            </div>
            {/* New Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700"
              >
                Mật khẩu mới
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-200"
                  placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                  autoComplete="new-password"
                />
              </div>
            </div>
            {/* Confirm New Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="confirm-new-password"
                className="block text-sm font-medium text-gray-700"
              >
                Xác nhận mật khẩu mới
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>

                <input
                  type="password"
                  id="confirm-new-password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-200"
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Error Message - TEXT COLOR CHANGED TO text-gray-900 (black/dark-gray) */}

            {errorMessage && (
              <div
                className="flex items-center space-x-2 p-3 bg-red-50 border border-red-300 rounded-lg shadow-sm"
                role="alert"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />

                <p className="text-gray-900 text-sm font-medium">
                  {" "}
                  {/* CHANGED FROM text-red-800 */} {errorMessage}
                </p>
              </div>
            )}

            {/* Success Message - TEXT COLOR CHANGED TO text-gray-900 (black/dark-gray) */}

            {successMessage && (
              <div
                className="flex items-center space-x-2 p-3 bg-green-50 border border-green-300 rounded-lg shadow-sm"
                role="status"
              >
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />

                <p className="text-gray-900 text-sm font-medium">
                  {" "}
                  {/* CHANGED FROM text-green-800 */}
                  {successMessage}
                </p>
              </div>
            )}
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.01] disabled:hover:scale-100 disabled:cursor-not-allowed"
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
                  Đang xử lý...
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Đổi Mật Khẩu
                </>
              )}
            </button>
          </form>
          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 Movie Management System Security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordForm;
