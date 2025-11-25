import { useAuth } from '@/context/AuthContext';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { modalOverlayClass, modalPanelClass } from '@/styles/modalStyles';
import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { BiSearch } from 'react-icons/bi';
import { BsKanban } from 'react-icons/bs';
import { FiLogOut, FiSettings } from 'react-icons/fi';
import { HiOutlinePlus, HiShieldCheck } from 'react-icons/hi';
import { RiDashboardLine } from 'react-icons/ri';
import { useLocation, useNavigate } from 'react-router-dom';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      {isOpen && <CommandPaletteModal onClose={() => setIsOpen(false)} />}
    </>
  );
};

// Inner component to handle animation state properly
const CommandPaletteModal = ({ onClose }: { onClose: () => void }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const { stage, close } = useModalAnimation(onClose);

    // Check if we are in a board context
    const boardMatch = location.pathname.match(/^\/boards\/(\d+)\/(\d+)$/);
    const isBoardContext = !!boardMatch;

    const runCommand = (command: () => void) => {
        // Close first then run command
        close();
        command();
    };

    return (
        <div className={modalOverlayClass(stage, "z-[9999]")} onClick={close}>
            <div
                className={modalPanelClass({ stage, maxWidth: 'max-w-2xl', padding: 'p-0', extra: 'overflow-hidden' })}
                onClick={(e) => e.stopPropagation()}
            >
                <Command className="w-full bg-transparent">
                    <div className="flex items-center border-b border-white/20 px-4" cmdk-input-wrapper="">
                        <BiSearch className="mr-3 h-5 w-5 text-slate-500" />
                        <Command.Input
                            autoFocus
                            className="w-full border-0 bg-transparent py-4 text-slate-800 placeholder:text-slate-400 focus:ring-0 sm:text-sm outline-none"
                            placeholder="Type a command or search..."
                        />
                    </div>
                    <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2">
                        <Command.Empty className="py-6 text-center text-sm text-slate-500">
                            No results found.
                        </Command.Empty>

                        <Command.Group heading="Navigation" className="mb-2 px-2 text-xs font-semibold text-slate-500">
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/dashboard'))}
                                className="group flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-slate-700 aria-selected:bg-indigo-500/10 aria-selected:text-indigo-700"
                            >
                                <RiDashboardLine className="mr-2 h-4 w-4 text-slate-500 group-aria-selected:text-indigo-600" />
                                Go to Dashboard
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/boards'))}
                                className="group flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-slate-700 aria-selected:bg-indigo-500/10 aria-selected:text-indigo-700"
                            >
                                <BsKanban className="mr-2 h-4 w-4 text-slate-500 group-aria-selected:text-indigo-600" />
                                Go to Boards
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/audit-logs'))}
                                className="group flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-slate-700 aria-selected:bg-indigo-500/10 aria-selected:text-indigo-700"
                            >
                                <HiShieldCheck className="mr-2 h-4 w-4 text-slate-500 group-aria-selected:text-indigo-600" />
                                Go to Audit Logs
                            </Command.Item>
                        </Command.Group>

                        {isBoardContext && (
                            <Command.Group heading="Actions" className="mb-2 px-2 text-xs font-semibold text-slate-500">
                                <Command.Item
                                    onSelect={() => runCommand(() => {
                                        // Dispatch custom event to open create card modal without navigation
                                        window.dispatchEvent(new CustomEvent('kanban:open-create-card'));
                                    })}
                                    className="group flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-slate-700 aria-selected:bg-indigo-500/10 aria-selected:text-indigo-700"
                                >
                                    <HiOutlinePlus className="mr-2 h-4 w-4 text-slate-500 group-aria-selected:text-indigo-600" />
                                    Create New Issue
                                </Command.Item>
                            </Command.Group>
                        )}

                        <Command.Group heading="Settings" className="mb-2 px-2 text-xs font-semibold text-slate-500">
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/profile'))}
                                className="group flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-slate-700 aria-selected:bg-indigo-500/10 aria-selected:text-indigo-700"
                            >
                                <FiSettings className="mr-2 h-4 w-4 text-slate-500 group-aria-selected:text-indigo-600" />
                                Settings
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => logout())}
                                className="group flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-slate-700 aria-selected:bg-indigo-500/10 aria-selected:text-indigo-700"
                            >
                                <FiLogOut className="mr-2 h-4 w-4 text-slate-500 group-aria-selected:text-indigo-600" />
                                Log out
                            </Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}
