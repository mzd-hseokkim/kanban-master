export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-pastel-blue-200 py-2 px-4 sm:px-6 lg:px-8 flex-shrink-0">
      <div className="w-full max-w-[95vw] mx-auto">
        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="text-pastel-blue-600">
              © {currentYear} Kanban Board. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-pastel-blue-600 hover:text-pastel-blue-700 transition">
              Privacy
            </a>
            <a href="#" className="text-pastel-blue-600 hover:text-pastel-blue-700 transition">
              Terms
            </a>
            <a href="#" className="text-pastel-blue-600 hover:text-pastel-blue-700 transition">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
