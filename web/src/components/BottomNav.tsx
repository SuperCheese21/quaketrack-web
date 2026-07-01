import { NavLink } from 'react-router-dom';

import { ListIcon, MapIcon } from './icons';

const itemClassName = ({ isActive }: { isActive: boolean }): string =>
  [
    'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium',
    isActive ? 'text-primary' : 'text-base-content/60',
  ].join(' ');

// Mobile-only bottom tab bar, mirroring the RN app's TabNavigator.
const BottomNav = () => (
  <nav
    className="flex border-t border-base-300 bg-base-100 md:hidden"
    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
  >
    <NavLink to="/" end className={itemClassName}>
      <ListIcon width={22} height={22} />
      List
    </NavLink>
    <NavLink to="/map" className={itemClassName}>
      <MapIcon width={22} height={22} />
      Map
    </NavLink>
  </nav>
);

export default BottomNav;
