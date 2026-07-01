import type { ReactNode } from 'react';

import BottomNav from './BottomNav';
import HeaderBar from './HeaderBar';

interface LayoutProps {
  children: ReactNode;
  onOpenFilters: () => void;
  onOpenNotifications: () => void;
}

const Layout = ({
  children,
  onOpenFilters,
  onOpenNotifications,
}: LayoutProps) => (
  <div className="flex h-full flex-col bg-base-200 text-base-content">
    <HeaderBar
      onOpenFilters={onOpenFilters}
      onOpenNotifications={onOpenNotifications}
    />
    <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    <BottomNav />
  </div>
);

export default Layout;
