import React, { useState, useRef } from 'react';

interface LogoUploadProps {
  value: string;
  onChange: (base64: string) => void;
  onClear: () => void;
  error?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

const LogoUpload: React.FC<LogoUploadProps> = ({ value, onChange, onClear, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Invalid file type. Please use PNG, JPG, or SVG.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("File is too large. Maximum size allowed is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-4 border-dashed rounded-[2.5rem] transition-all duration-300 p-8 flex flex-col items-center justify-center text-center
          ${isDragging ? 'border-indigo-600 bg-indigo-50/50 scale-[1.02]' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'}
          ${error ? 'border-rose-300 bg-rose-50/30' : ''}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept={ALLOWED_TYPES.join(',')} 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }} 
        />

        {value ? (
          <div className="relative w-40 h-40 group/preview animate-in zoom-in-95 duration-300">
            <img src={value} alt="Preview" className="w-full h-full object-contain rounded-2xl bg-white p-4 shadow-xl" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
              <span className="text-white text-[10px] font-black uppercase tracking-widest">Change Image</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute -top-3 -right-3 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 hover:scale-110 transition-all z-10"
              title="Remove Logo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:scale-110 transition-all shadow-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Drop brand logo here</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">or click to browse filesystem</p>
            </div>
          </div>
        )}
        
        {isDragging && (
          <div className="absolute inset-0 bg-indigo-600/10 rounded-[2.2rem] flex items-center justify-center pointer-events-none">
            <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl animate-bounce">
              Drop to Set Logo
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between px-2">
        {error ? (
          <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight">{error}</p>
        ) : (
          <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Max 2MB • PNG, JPG, SVG</p>
        )}
      </div>
    </div>
  );
};

export default LogoUpload;