// Tek dosyada toplanmış satır içi SVG ikon seti — dış bağımlılık yok,
// hepsi currentColor kullanır ve tema değişkenlerine uyum sağlar.

const Icon = ({ children, ...props }) => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" {...props}>
    {children}
  </svg>
);

export const DropIcon = (props) => (
  <Icon {...props}>
    <path d="M12 3.2 7.4 9.3a5.8 5.8 0 1 0 9.2 0Z" />
  </Icon>
);

export const ThermometerIcon = (props) => (
  <Icon {...props}>
    <path d="M10 13.6V5a2 2 0 1 1 4 0v8.6a4 4 0 1 1-4 0Z" />
  </Icon>
);

export const BatteryIcon = (props) => (
  <Icon {...props}>
    <rect x="2.5" y="8" width="15" height="8" rx="2" />
    <path d="M20.5 11v2" />
  </Icon>
);

export const WindIcon = (props) => (
  <Icon {...props}>
    <path d="M3 8h10a3 3 0 1 0-3-3" />
    <path d="M3 16h13a3 3 0 1 1-3 3" />
    <path d="M3 12h7" />
  </Icon>
);

export const AlertIcon = (props) => (
  <Icon {...props}>
    <path d="M12 4.5 2.8 20h18.4Z" />
    <path d="M12 10v4" />
    <path d="M12 17h.01" />
  </Icon>
);

export const CheckIcon = (props) => (
  <Icon {...props}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
  </Icon>
);

export const UserIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="8.5" r="3.7" />
    <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
  </Icon>
);

export const LockIcon = (props) => (
  <Icon {...props}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8.5 10.5V7.5a3.5 3.5 0 1 1 7 0v3" />
  </Icon>
);

export const EyeIcon = (props) => (
  <Icon {...props}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Icon>
);

export const EyeOffIcon = (props) => (
  <Icon {...props}>
    <path d="M4 4.5 20 20" />
    <path d="M9.6 6.2A9.4 9.4 0 0 1 12 5.8c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-3.3 4" />
    <path d="M6.3 8.1A16.6 16.6 0 0 0 2.5 12S6 18.2 12 18.2a9.7 9.7 0 0 0 3.6-.7" />
  </Icon>
);

export const SunIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4" />
  </Icon>
);

export const MoonIcon = (props) => (
  <Icon {...props}>
    <path d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
  </Icon>
);

export const LogoutIcon = (props) => (
  <Icon {...props}>
    <path d="M14.5 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3" />
    <path d="M10 8.5 13.5 12 10 15.5" />
    <path d="M13.5 12h-9" />
  </Icon>
);

export const SensorIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="2.4" />
    <path d="M8.2 15.8a5.4 5.4 0 0 1 0-7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6" />
    <path d="M5.5 18.5a9.2 9.2 0 0 1 0-13M18.5 5.5a9.2 9.2 0 0 1 0 13" />
  </Icon>
);

export const TableIcon = (props) => (
  <Icon {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M9.5 9.5v10" />
  </Icon>
);

export const ChartIcon = (props) => (
  <Icon {...props}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M7.5 15.5 11 10.5l3.2 3 4.3-6" />
  </Icon>
);

export const Logo = (props) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
    <rect width="32" height="32" rx="9" fill="var(--series-moisture)" />
    <path
      d="M16 7.5 11.4 14a5.6 5.6 0 1 0 9.2 0Z"
      fill="none"
      stroke="#04121f"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path d="M16 16.5v4.4" stroke="#04121f" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);
