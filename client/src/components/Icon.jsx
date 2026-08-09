export function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
    building: <><path d="M4 21h16" /><path d="M6 21V5h12v16" /><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
    contact: <><path d="M16 3H8a2 2 0 0 0-2 2v14l6-3 6 3V5a2 2 0 0 0-2-2Z" /></>,
    cart: <><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H7" /></>,
    package: <><path d="M12 3 3 7.5V16.5L12 21l9-4.5V7.5L12 3Z" /><path d="M12 12 3 7.5M12 12l9-4.5M12 12v9" /></>,
    wallet: <><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M16 14h2" /></>,
    kanban: <><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="10" rx="1" /><rect x="17" y="4" width="5" height="13" rx="1" /></>,
    file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5" /></>,
    life: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></>,
    chat: <><path d="M21 12a8 8 0 0 1-11.7 7L3 21l2-6.3A8 8 0 1 1 21 12Z" /></>,
    shield: <><path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z" /></>,
    bot: <><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 4v4M9 13h.01M15 13h.01M9 17h6" /></>,
    chart: <><path d="M4 19h16" /><path d="M7 16V9M12 16V5M17 16v-7" /></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    lock: <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  };
  return <svg {...common}>{paths[name] || paths.home}</svg>;
}
