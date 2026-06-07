// Frontend/src/components/Chat/nexus-chat/MediaGallery.tsx
import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Message } from "@/types/chat";

interface Props {
  messages: Message[];
}

function formatMonthYear(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Lightbox ───────────────────────────────────────────────────────────────
function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] max-h-[90vh] p-0 border-0 bg-transparent shadow-none flex items-center justify-center overflow-hidden">
        <div className="relative flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            className="max-w-[88vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            title="Tải xuống"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Media Tab (Images) ──────────────────────────────────────────────────────
function MediaTab({ messages }: { messages: Message[] }) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const imageMessages = useMemo(
    () => messages.filter((m) => m.imgUrl && !m.isDeleted),
    [messages]
  );

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const m of [...imageMessages].reverse()) {
      const key = formatMonthYear(m.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return map;
  }, [imageMessages]);

  if (imageMessages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-slate-400 dark:text-slate-500">
        <span className="material-symbols-outlined text-5xl">photo_library</span>
        <p className="text-sm font-medium">Chưa có ảnh nào</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 py-2">
        {Array.from(grouped.entries()).map(([month, msgs]) => (
          <div key={month}>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 px-1">
              {month}
            </p>
            <div className="grid grid-cols-3 gap-1">
              {msgs.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => setLightboxSrc(m.imgUrl!)}
                  className="aspect-square overflow-hidden rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title={formatDate(m.createdAt)}
                >
                  <img
                    src={m.imgUrl!}
                    alt={formatDate(m.createdAt)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt="Xem ảnh"
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}

// ─── File Tab ─────────────────────────────────────────────────────────────────
function FileTab({ messages }: { messages: Message[] }) {
  const fileMessages = useMemo(
    () => messages.filter((m) => m.fileAttachment && !m.isDeleted),
    [messages]
  );

  if (fileMessages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-slate-400 dark:text-slate-500">
        <span className="material-symbols-outlined text-5xl">folder_open</span>
        <p className="text-sm font-medium">Chưa có file nào</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 py-2">
      {[...fileMessages].reverse().map((m) => {
        const f = m.fileAttachment!;
        return (
          <a
            key={m._id}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            download={f.name}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-[20px]">description</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {f.name}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {formatFileSize(f.size)}{f.size > 0 ? " · " : ""}{formatDate(m.createdAt)}
              </p>
            </div>
            <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-blue-500 transition-colors shrink-0">
              download
            </span>
          </a>
        );
      })}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function MediaGallery({ messages }: Props) {
  const [activeTab, setActiveTab] = useState<"media" | "file">("media");

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 mb-1">
        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors relative ${
            activeTab === "media"
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
          }`}
        >
          File phương tiện
          {activeTab === "media" && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("file")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors relative ${
            activeTab === "file"
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
          }`}
        >
          File
          {activeTab === "file" && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>
      </div>

      {activeTab === "media" ? (
        <MediaTab messages={messages} />
      ) : (
        <FileTab messages={messages} />
      )}
    </div>
  );
}
