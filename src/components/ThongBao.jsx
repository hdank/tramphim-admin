import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { X, Save, Edit, Plus } from "lucide-react";
// Giả định các imports này hoạt động trong môi trường của bạn
import { BASE_API_URL } from "../config/api";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import MenuBar from "./MenuBar";

const ThongBaoModal = ({ thongBaoData, onClose }) => {
  const [noidung, setNoidung] = useState(thongBaoData?.noidung || "");
  const isNew = thongBaoData.id === 0;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
      }),
      TextStyle,
      Color,
    ],
    content: noidung, // Nội dung ban đầu
    onUpdate: ({ editor }) => {
      setNoidung(editor.getHTML()); // Cập nhật state mỗi khi nội dung thay đổi
    },
    editorProps: {
      attributes: {
        class:
          // Đã thêm class 'text-gray-900' để đảm bảo màu chữ là màu đen (dark)
          "prose prose-sm sm:prose-base max-w-none mx-auto p-4 min-h-[250px] border-x border-b border-slate-200 rounded-b-lg focus:outline-none text-gray-900",
      },
    },
  });

  const handleSave = async () => {
    try {
      const payload = { noidung };
      const url = `${BASE_API_URL}/phim/${thongBaoData.slug}/thong-bao`;
      const method = isNew ? "post" : "put";

      await axios({ method, url, data: payload });

      toast.success(
        isNew
          ? "Tạo thông báo thành công! ✨"
          : "Cập nhật thông báo thành công! 🎉"
      );
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu thông báo:", error.response?.data || error);
      toast.error(
        `Lỗi: ${error.response?.data?.detail || "Không thể lưu thông báo."}`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black bg-opacity-60">
      <div className="relative w-full max-w-3xl mx-auto my-6">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
            <h3 className="text-xl font-semibold text-gray-900">
              {isNew ? (
                <>
                  <Plus size={24} className="inline mr-2" /> Thêm thông báo:
                </>
              ) : (
                <>
                  <Edit size={24} className="inline mr-2" /> Chỉnh sửa thông báo
                </>
              )}
              {thongBaoData?.ten_phim && (
                <span className="ml-2 font-bold text-blue-600">
                  {thongBaoData.ten_phim}
                </span>
              )}
            </h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-gray-500 float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:text-gray-900"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="relative p-6 flex-auto">
            <div className="bg-white rounded-lg border border-slate-200">
              <MenuBar editor={editor} />
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-solid border-slate-200 rounded-b">
            <button
              className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 hover:bg-red-50 rounded-md"
              type="button"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              className="flex items-center gap-2 bg-gray-900 text-white active:bg-gray-700 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
              type="button"
              onClick={handleSave}
            >
              <Save size={18} /> Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThongBaoModal;
