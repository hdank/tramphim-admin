// src/components/ToastProvider.jsx
import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastProvider = ({ children }) => {
  return (
    <>
      {children}
      <ToastContainer position="bottom-right" autoClose={2000} />
    </>
  );
};

// Export a hook that wraps react-toastify's toast
export const useToast = () => {
  return {
    showToast: (message, type = "info") => {
      switch (type) {
        case "success":
          toast.success(message);
          break;
        case "error":
          toast.error(message);
          break;
        case "warning":
          toast.warning(message);
          break;
        case "info":
        default:
          toast.info(message);
          break;
      }
    }
  };
};

export default ToastProvider;
