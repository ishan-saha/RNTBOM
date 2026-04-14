const loaderStyles = `
  @keyframes orbital-rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes loading-dot-fade {
    0%, 20% { opacity: 0.2; transform: translateY(0); }
    50% { opacity: 1; transform: translateY(-1px); }
    100% { opacity: 0.2; transform: translateY(0); }
  }
  
  .loader-orbit {
    animation: orbital-rotate 1.7s linear infinite;
  }

  .loader-dot-1 {
    animation: loading-dot-fade 1.2s infinite;
  }

  .loader-dot-2 {
    animation: loading-dot-fade 1.2s infinite 0.2s;
  }

  .loader-dot-3 {
    animation: loading-dot-fade 1.2s infinite 0.4s;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = loaderStyles;
  document.head.appendChild(styleSheet);
}

export const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Use concentric rings so the loader reads as a clean circular system on all screen sizes. */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24">
          <div className="absolute inset-0 rounded-full border border-indigo-400/15" />
          <div className="absolute inset-2 rounded-full border border-white/5" />

          {/* Center dot - subtle reference point */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400/40 shadow-[0_0_18px_rgba(129,140,248,0.25)]" />
          </div>

          {/* Orbiting container - rotates continuously */}
          <div className="absolute inset-0 loader-orbit">
            {/* Place orbit pieces on evenly spaced circular coordinates so the path reads as a true circle. */}
            <div
              className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-indigo-400"
              style={{ left: '50%', top: '8%', transform: 'translate(-50%, -50%)' }}
            />
            <div
              className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-indigo-500"
              style={{ left: '90%', top: '37%', transform: 'translate(-50%, -50%)' }}
            />
            <div
              className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-indigo-400"
              style={{ left: '74%', top: '84%', transform: 'translate(-50%, -50%)' }}
            />
            <div
              className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-indigo-500"
              style={{ left: '26%', top: '84%', transform: 'translate(-50%, -50%)' }}
            />
            <div
              className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-indigo-400"
              style={{ left: '10%', top: '37%', transform: 'translate(-50%, -50%)' }}
            />
          </div>
        </div>

        {/* Animate the trailing dots one-by-one to add subtle progress feedback without changing loader behavior. */}
        <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-0.5">
          <span>Loading</span>
          <span className="loader-dot-1">.</span>
          <span className="loader-dot-2">.</span>
          <span className="loader-dot-3">.</span>
        </p>
      </div>
    </div>
  );
};

export default Loader;
