import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

type GeminiModalProps = {
  isOpen: boolean;
  onClose: () => void;
  message: string;
};

export default function GeminiModal({ isOpen, onClose, message }: GeminiModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div
        ref={modalRef}
        className="w-full max-w-lg animate-fade-in rounded-2xl bg-white p-6 shadow-xl transition-transform duration-300"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-blue-700">✦ Recomendación de Gemini</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto rounded bg-gray-50 p-3 text-sm leading-relaxed text-gray-800 prose prose-sm prose-blue">
          <ReactMarkdown>{message}</ReactMarkdown>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
