import React from "react";
import {
      Bold,
      Italic,
      Strikethrough,
      List,
      ListOrdered,
      Heading2,
      Palette,
} from "lucide-react";

const MenuBar = ({ editor }) => {
      if (!editor) {
            return null;
      }

      const currentColor = editor.getAttributes("textStyle").color || "#000000";

      const menuItems = [
            {
                  action: () => editor.chain().focus().toggleBold().run(),
                  icon: Bold,
                  title: "In đậm",
                  isActive: editor.isActive("bold"),
            },
            {
                  action: () => editor.chain().focus().toggleItalic().run(),
                  icon: Italic,
                  title: "In nghiêng",
                  isActive: editor.isActive("italic"),
            },
            {
                  action: () => editor.chain().focus().toggleStrike().run(),
                  icon: Strikethrough,
                  title: "Gạch ngang",
                  isActive: editor.isActive("strike"),
            },
            {
                  action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                  icon: Heading2,
                  title: "Tiêu đề",
                  isActive: editor.isActive("heading", { level: 2 }),
            },
            {
                  action: () => editor.chain().focus().toggleBulletList().run(),
                  icon: List,
                  title: "Danh sách (gạch đầu dòng)",
                  isActive: editor.isActive("bulletList"),
            },
            {
                  action: () => editor.chain().focus().toggleOrderedList().run(),
                  icon: ListOrdered,
                  title: "Danh sách (số thứ tự)",
                  isActive: editor.isActive("orderedList"),
            },
      ];

      return (
            <div className="flex items-center gap-1 p-2 border-b border-slate-200 flex-wrap">
                  {menuItems.map((item, index) => (
                        <button
                              key={index}
                              onClick={item.action}
                              title={item.title}
                              className={`p-2 rounded-md transition-colors ${item.isActive
                                          ? "bg-gray-900 text-white"
                                          : "bg-white text-gray-700 hover:bg-gray-100"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                              <item.icon size={18} />
                        </button>
                  ))}

                  {/* Nút chọn màu chữ */}
                  <div className="relative flex items-center" title="Chọn màu chữ">
                        <Palette
                              size={18}
                              className="absolute left-2.5 pointer-events-none"
                              style={{ color: currentColor }}
                        />
                        <input
                              type="color"
                              onInput={(event) =>
                                    editor.chain().focus().setColor(event.target.value).run()
                              }
                              value={currentColor}
                              className="w-10 h-9 p-0 pl-9 bg-transparent border-none rounded-md cursor-pointer appearance-none"
                        />
                  </div>
            </div>
      );
};

export default MenuBar;
