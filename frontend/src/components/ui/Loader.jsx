import { useTheme } from "../../context/ThemeContext";

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

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = loaderStyles;
  document.head.appendChild(styleSheet);
}

export const Loader = ({ fullScreen = true }) => {
  const theme = useTheme();
  const isDark = theme?.isDark ?? true; // Fallback to true if context is missing

  return (
    <div
      className={`${fullScreen ? "fixed inset-0" : "absolute inset-0"} z-50 flex items-center justify-center p-4 ${
        isDark
          ? "bg-black/20 backdrop-blur-[2px]"
          : "bg-white/30 backdrop-blur-[2px]"
      }`}
    >
      <div className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-xs sm:max-w-sm">
        {/* Use concentric rings so the loader reads as a clean circular system on all screen sizes. */}
        <div
          className={`relative shrink-0 ${fullScreen ? "w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24" : "w-12 h-12 sm:w-14 sm:h-14"}`}
        >
          <div
            className={`absolute inset-0 rounded-full border ${
              isDark ? "border-indigo-400/15" : "border-indigo-600/10"
            }`}
          />
          <div
            className={`absolute inset-2 rounded-full border ${
              isDark ? "border-white/5" : "border-indigo-900/5"
            }`}
          />

          {/* Center dot - subtle reference point */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isDark
                  ? "bg-indigo-400/40 shadow-[0_0_18px_rgba(129,140,248,0.25)]"
                  : "bg-indigo-600/30 shadow-[0_0_18px_rgba(79,70,229,0.15)]"
              }`}
            />
          </div>

          {/* Orbiting container - rotates continuously */}
          <div className="absolute inset-0 loader-orbit">
            {/* Place orbit pieces on evenly spaced circular coordinates so the path reads as a true circle. */}
            <div
              className={`absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                isDark ? "bg-indigo-400" : "bg-indigo-600"
              }`}
              style={{
                left: "50%",
                top: "8%",
                transform: "translate(-50%, -50%)",
              }}
            />
            <div
              className={`absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                isDark ? "bg-indigo-500" : "bg-indigo-700"
              }`}
              style={{
                left: "90%",
                top: "37%",
                transform: "translate(-50%, -50%)",
              }}
            />
            <div
              className={`absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                isDark ? "bg-indigo-400" : "bg-indigo-600"
              }`}
              style={{
                left: "74%",
                top: "84%",
                transform: "translate(-50%, -50%)",
              }}
            />
            <div
              className={`absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                isDark ? "bg-indigo-500" : "bg-indigo-700"
              }`}
              style={{
                left: "26%",
                top: "84%",
                transform: "translate(-50%, -50%)",
              }}
            />
            <div
              className={`absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                isDark ? "bg-indigo-400" : "bg-indigo-600"
              }`}
              style={{
                left: "10%",
                top: "37%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        </div>

        {/* Animate the trailing dots one-by-one to add subtle progress feedback without changing loader behavior. */}
        <p
          className={`text-xs sm:text-sm font-medium flex items-center gap-0.5 ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
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
