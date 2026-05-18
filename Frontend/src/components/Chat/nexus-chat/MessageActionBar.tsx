import { Reply, Forward, Copy, Pin, Trash, Undo2 } from "lucide-react";

interface ActionBarProps {
  isOwnMessage: boolean;
}

export const MessageActionBar = ({ isOwnMessage }: ActionBarProps) => {
  return (
    <div
      className={`absolute -top-5 ${isOwnMessage ? "right-0" : "left-0"} 
                  bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md px-2 py-1 
                  flex items-center gap-2 
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20`}
    >
      {/* ── CỤM CẢM XÚC ── */}
      <div className="flex items-center gap-1.5 border-r pr-2 border-gray-200 dark:border-gray-600">
        {/* 1. Nút Like */}
        {/* Ghi chú các class CSS tạo hiệu ứng và khung cho button:
        - Cụm định hình khung: 'flex items-center justify-center w-7 h-7'
          + Ép cứng kích thước vùng bấm là 28x28px để nút không bị Flexbox bóp xẹp (squish).
          + Căn giữa thẻ <img> theo cả 2 trục X và Y.
        - Cụm hiệu ứng nảy (Hover):
          + 'hover:-translate-y-1': Nhấc icon dịch lên trên 4px khi hover.
          + 'hover:scale-125': Phóng to kích thước icon lên 125%.
          + 'origin-bottom': Neo cố định cạnh đáy của button, giúp icon phình lên trên thay vì tràn ra 4 phía.
          + 'transition-transform': Tạo thời gian chuyển tiếp mượt mà cho hiệu ứng phóng to và dịch chuyển.
      */}
        <button
          className="flex items-center justify-center w-7 h-7 hover:scale-125 transition-transform origin-bottom hover:-translate-y-1"
          title="like"
        >
          <img
            src="/reactions/like.png"
            alt="like"
            className="w-5 h-5 object-contain drop-shadow-sm"
          />
        </button>

        {/* 2. Nút Heart */}
        <button
          className="flex items-center justify-center w-7 h-7hover:scale-125 transition-transform origin-bottom hover:-translate-y-1"
          title="heart"
        >
          <img
            src="/reactions/heart.png"
            alt="heart"
            className="w-5 h-5 object-contain drop-shadow-sm"
          />
        </button>

        {/* 3. Nút Haha */}
        <button
          className="flex items-center justify-center w-7 h-7hover:scale-125 transition-transform origin-bottom hover:-translate-y-1"
          title="haha"
        >
          <img
            src="/reactions/haha.png"
            alt="haha"
            className="w-5 h-5 object-contain drop-shadow-sm"
          />
        </button>

        {/* 4. Nút Sad */}
        <button
          className="flex items-center justify-center w-7 h-7 hover:scale-125 transition-transform origin-bottom hover:-translate-y-1"
          title="sad"
        >
          <img
            src="/reactions/sad.png"
            alt="sad"
            className="w-5 h-5 object-contain drop-shadow-sm"
          />
        </button>

        {/* 5. Nút Wow */}
        <button
          className="flex items-center justify-center w-7 h-7 hover:scale-125 transition-transform origin-bottom hover:-translate-y-1"
          title="wow"
        >
          <img
            src="/reactions/wow.png"
            alt="wow"
            className="w-5 h-5 object-contain drop-shadow-sm"
          />
        </button>

        {/* 6. Nút Angry */}
        <button
          className="flex items-center justify-center w-7 h-7 hover:scale-125 transition-transform origin-bottom hover:-translate-y-1"
          title="angry"
        >
          <img
            src="/reactions/angry.png"
            alt="angry"
            className="w-5 h-5 object-contain drop-shadow-sm"
          />
        </button>
      </div>

      {/* ── CỤM HÀNH ĐỘNG ── */}
      <div className="flex items-center gap-1.5 pl-1 text-gray-500 dark:text-gray-300">
        <button
          className="hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full tooltip"
          title="Trả lời"
        >
          <Reply size={16} />
        </button>
        <button
          className="hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full tooltip"
          title="Chuyển tiếp"
        >
          <Forward size={16} />
        </button>
        <button
          className="hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full tooltip"
          title="Sao chép"
        >
          <Copy size={16} />
        </button>
        <button
          className="hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full tooltip"
          title="Ghim"
        >
          <Pin size={16} />
        </button>

        <button
          className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-full tooltip"
          title="Xóa phía tôi"
        >
          <Trash size={16} />
        </button>

        {isOwnMessage && (
          <button
            className="hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 p-1 rounded-full tooltip"
            title="Thu hồi"
          >
            <Undo2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
