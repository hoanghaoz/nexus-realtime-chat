import { useEffect, useRef } from "react";

interface Props {
  onSelectFile: () => void;
  onSelectFolder: () => void;
  onClose: () => void;
}
const MenuFileDropdown = ({ onSelectFile, onSelectFolder, onClose }: Props) => {
  // Liên kết định vị các thẻ phục vụ cho Menu đính kèm
  const attachMenuRef = useRef<HTMLDivElement>(null); // Trỏ vào menu thư mục để xử lý sự kiện click ra ngoài

  // Xử lý khi click ra ngoài để đóng menu đính kèm
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        attachMenuRef.current &&
        !attachMenuRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={attachMenuRef}
      className="absolute bottom-full left-0 mb-3 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Option 1: Chọn File */}
      <button
        type="button"
        onClick={() => {
          onSelectFile();
          onClose(); // chọn xong thì đóng menu
        }}
        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
      >
        <span className="material-symbols-outlined text-[20px] text-blue-500">
          description
        </span>
        Chọn File / Ảnh
      </button>

      {/* Đường kẻ ngang */}
      <div className="h-[1px] bg-slate-100 dark:bg-slate-700 mx-2"></div>

      {/* Option 2: Chọn Thư mục */}
      <button
        type="button"
        onClick={() => {
          onSelectFolder();
          onClose(); // chọn xong thì đóng menu
        }}
        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
      >
        <span className="material-symbols-outlined text-[20px] text-amber-500">
          folder
        </span>
        Chọn Thư mục
      </button>
    </div>
  );
};

export default MenuFileDropdown;
