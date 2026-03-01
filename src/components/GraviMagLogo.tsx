const GraviMagLogo = ({ size = 40, className = '' }: { size?: number; className?: string }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background rounded square */}
      <rect width="64" height="64" rx="14" fill="hsl(358, 78%, 51%)" />
      
      {/* Abstract gravity field lines - concentric arcs */}
      <path
        d="M32 52C43.046 52 52 43.046 52 32"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M32 46C39.732 46 46 39.732 46 32"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M32 40C36.418 40 40 36.418 40 32"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      
      {/* Central node / measurement point */}
      <circle cx="32" cy="32" r="4" fill="white" />
      
      {/* Magnetic field arrow - diagonal */}
      <path
        d="M18 18L28 28"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M18 18L24 18L18 24"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Downward gravity vector */}
      <path
        d="M32 38L32 50"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M29 47L32 51L35 47"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
};

export default GraviMagLogo;
