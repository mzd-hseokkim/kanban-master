export const Footer = () => {
  const currentYear = new Date().getFullYear();

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
            <a href="#" className="text-slate-400 hover:text-white transition">
              Privacy
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition">
              Terms
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
