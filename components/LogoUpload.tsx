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
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setLocalError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalError("Invalid Type: Use PNG, JPG, or SVG shards only.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setLocalError("Volume Error: Identity shard exceeds 2MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
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
        className={`relative group cursor-pointer border-4 border-dashed rounded-[3rem] transition-all duration-500 p-12 flex flex-col items-center justify-center text-center
          ${isDragging ? 'border-indigo-600 bg-indigo-50/50 scale-[1.02]' : 'border-slate-100 bg-white hover:bg-indigo-50/30 hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-100/50'}
          ${(error || localError) ? 'border-rose-300 bg-rose-50/30' : ''}
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
          <div className="relative w-48 h-48 group/preview animate-in zoom-in-95 duration-500">
            <img src={value} alt="Preview" className="w-full h-full object-contain rounded-3xl bg-white p-6 shadow-2xl border border-slate-100" />
            <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover/preview:opacity-100 transition-all rounded-3xl flex flex-col items-center justify-center backdrop-blur-sm">
              <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Replace Node</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute -top-4 -right-4 w-10 h-10 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-rose-600 hover:scale-110 transition-all z-10 border-4 border-white"
              title="Purge Logo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <div className="py-6 space-y-8">
            <div className="w-20 h-20 mx-auto bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:scale-110 transition-all shadow-inner border border-slate-100">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-black text-slate-700 uppercase italic tracking-tighter">Locate Institutional Logo</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Drag & Drop Binary or Click to Browse</p>
            </div>
          </div>
        )}
        
        {isDragging && (
          <div className="absolute inset-0 bg-indigo-600/10 rounded-[2.8rem] flex items-center justify-center pointer-events-none">
            <div className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl animate-bounce">
              Inject Data Shard
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between px-6">
        {(error || localError) ? (
          <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest animate-pulse">{error || localError}</p>
        ) : (
          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">Payload Protocol: PNG, JPG, SVG • Max 2MB</p>
        )}
      </div>
    </div>
  );
};

export default LogoUpload;
