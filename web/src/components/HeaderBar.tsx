import { NavLink } from 'react-router-dom';
import { Button } from 'stratosphere-ui';

import ThemeButton from './ThemeButton';
import { BellIcon, FilterIcon, ListIcon, MapIcon } from './icons';

interface HeaderBarProps {
  onOpenFilters: () => void;
  onOpenNotifications: () => void;
}

const tabClassName = ({ isActive }: { isActive: boolean }): string =>
  `tab gap-2 ${
    isActive
      ? 'tab-active font-semibold text-primary'
      : 'text-primary-content/80 hover:text-primary-content'
  }`;

const HeaderBar = ({ onOpenFilters, onOpenNotifications }: HeaderBarProps) => (
  <header className="navbar min-h-14 bg-primary px-2 text-primary-content shadow-md sm:px-4">
    <div className="navbar-start">
      <span className="text-xl font-bold tracking-tight">QuakeTrack</span>
    </div>

    <nav className="navbar-center hidden md:flex">
      <div className="tabs tabs-box bg-primary-content/10">
        <NavLink to="/" end className={tabClassName}>
          <ListIcon width={18} height={18} /> List
        </NavLink>
        <NavLink to="/map" className={tabClassName}>
          <MapIcon width={18} height={18} /> Map
        </NavLink>
      </div>
    </nav>

    <div className="navbar-end gap-1">
      <ThemeButton />
      <Button
        color="ghost"
        shape="circle"
        className="text-primary-content"
        aria-label="Filters"
        onClick={onOpenFilters}
      >
        <FilterIcon />
      </Button>
      <Button
        color="ghost"
        shape="circle"
        className="text-primary-content"
        aria-label="Notification settings"
        onClick={onOpenNotifications}
      >
        <BellIcon />
      </Button>
    </div>
  </header>
);

export default HeaderBar;
