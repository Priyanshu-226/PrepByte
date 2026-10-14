// Small inline icons (same 24px stroke style as lucide) for the few the app needs beyond lucide-react.
const make = children =>
  function Icon({ size = 16, ...props }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
        {children}
      </svg>
    );
  };

export const FlameIcon = make(<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />);
export const RefreshIcon = make(<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>);
export const ExternalIcon = make(<><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>);
export const PlayIcon = make(<polygon points="6 3 20 12 6 21 6 3" />);
export const PauseIcon = make(<><rect x="14" y="4" width="4" height="16" rx="1" /><rect x="6" y="4" width="4" height="16" rx="1" /></>);
export const DownloadIcon = make(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></>);
export const UploadIcon = make(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></>);
export const BackIcon = make(<><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>);
export const TimerIcon = make(<><circle cx="12" cy="14" r="8" /><path d="M12 14l3-3" /><path d="M10 2h4" /><path d="M12 2v4" /></>);
export const GoogleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.04 5.04 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.24 1.06-3.74 1.06-2.88 0-5.31-1.94-6.18-4.55H2.16v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.82 14.1A6.6 6.6 0 0 1 5.47 12c0-.73.13-1.43.35-2.1V7.06H2.16A11 11 0 0 0 1 12c0 1.77.42 3.45 1.16 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.35c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.16 7.06l3.66 2.84C6.69 7.29 9.12 5.35 12 5.35z" />
  </svg>
);
