export function CompassIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Black outline base */}
      <circle cx="9" cy="9" r="8.5" fill="#0d0805" />

      {/* Brass outer ring */}
      <circle cx="9" cy="9" r="8" fill="#92400e" />

      {/* Ring highlight — top-left */}
      <circle cx="9" cy="9" r="8" fill="none" stroke="#fbbf24" strokeWidth="0.6" opacity="0.4" />

      {/* Inner ring, slightly recessed */}
      <circle cx="9" cy="9" r="6.8" fill="#451a03" />

      {/* Dark compass face */}
      <circle cx="9" cy="9" r="6" fill="#130c05" />

      {/* Cardinal tick marks */}
      <rect x="8.3" y="3.4" width="1.4" height="2.2" rx="0.2" fill="#fbbf24" />
      <rect x="8.3" y="12.4" width="1.4" height="2.2" rx="0.2" fill="#78350f" />
      <rect x="12.4" y="8.3" width="2.2" height="1.4" rx="0.2" fill="#78350f" />
      <rect x="3.4" y="8.3" width="2.2" height="1.4" rx="0.2" fill="#78350f" />

      {/* N needle — bright gold */}
      <polygon points="9,4.2 10.1,8.6 9,9.2 7.9,8.6" fill="#fbbf24" />
      {/* N needle outline */}
      <polygon
        points="9,4.2 10.1,8.6 9,9.2 7.9,8.6"
        fill="none"
        stroke="#0d0805"
        strokeWidth="0.3"
        strokeLinejoin="round"
      />

      {/* S needle — dark red */}
      <polygon points="9,13.8 10.1,9.4 9,8.8 7.9,9.4" fill="#7c2d12" />
      <polygon
        points="9,13.8 10.1,9.4 9,8.8 7.9,9.4"
        fill="none"
        stroke="#0d0805"
        strokeWidth="0.3"
        strokeLinejoin="round"
      />

      {/* Center rivet */}
      <circle cx="9" cy="9" r="1.4" fill="#b45309" />
      <circle cx="9" cy="9" r="0.65" fill="#fef3c7" />
    </svg>
  );
}
