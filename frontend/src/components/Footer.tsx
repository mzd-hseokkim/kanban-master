import { Link, useLocation } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  const links = [
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <footer className="backdrop-blur-xl bg-slate-900/80 shadow-lg border-t border-white/5 py-2 px-4 sm:px-6 lg:px-8 flex-shrink-0 transition-colors duration-300">
      <div className="w-full max-w-[95vw] mx-auto">
        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="text-slate-400">
              © {currentYear} Kanban Board. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {links.map(({ label, to }) => {
              const isActive = location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`text-slate-400 hover:text-white transition ${
                    isActive ? 'text-white font-semibold underline underline-offset-4 decoration-white/80' : ''
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};
