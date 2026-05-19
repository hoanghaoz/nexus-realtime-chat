import { useEffect, useRef } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface Props {
  onEmojiSelect: (emoji: any) => void;
  onClose: () => void;
}

const EmojiPickerPanel = ({ onEmojiSelect, onClose }: Props) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Xử lý click ra ngoài để đóng panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
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
    // Đặt absolute và bottom-full để nó nổi lên ngay phía trên cái nút icon mặt cười
    <div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl rounded-xl animate-in slide-in-from-bottom-2 duration-200"
    >
      <Picker
        data={data}
        onEmojiSelect={onEmojiSelect}
        theme="auto"
        locale="vi"
        previewPosition="none"
        skinTonePosition="search"
      />
    </div>
  );
};

export default EmojiPickerPanel;
