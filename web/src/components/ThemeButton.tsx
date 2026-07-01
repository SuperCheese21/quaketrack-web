import { DropdownMenu } from 'stratosphere-ui';

import { useTheme } from '../lib/useTheme';
import { THEMES } from '../lib/themes';
import { CheckIcon, PaletteIcon } from './icons';

// A small preview of a theme's palette, scoped via its own `data-theme` so the
// swatch renders in that theme's colors regardless of the active one.
const ThemeSwatch = ({ theme }: { theme: string }) => (
  <span
    data-theme={theme}
    className="bg-base-100 border-base-content/20 flex gap-0.5 rounded-sm border p-0.5"
  >
    <span className="bg-primary h-3 w-1.5 rounded-xs" />
    <span className="bg-secondary h-3 w-1.5 rounded-xs" />
    <span className="bg-accent h-3 w-1.5 rounded-xs" />
  </span>
);

export const ThemeButton = () => {
  const { theme: activeTheme, setTheme } = useTheme();
  return (
    <DropdownMenu
      anchor="bottom end"
      buttonProps={{
        color: 'ghost',
        shape: 'circle',
        'aria-label': 'Select theme',
        title: 'Select theme',
        children: <PaletteIcon />,
      }}
      items={THEMES.map(({ id, label }) => ({
        id,
        onClick: () => {
          setTheme(id);
        },
        children: (
          <>
            <ThemeSwatch theme={id} />
            <span className="grow">{label}</span>
            {id === activeTheme ? <CheckIcon width={16} height={16} /> : null}
          </>
        ),
      }))}
      menuClassName="w-48 bg-base-200 z-50 max-h-96 overflow-y-auto"
    />
  );
};

export default ThemeButton;
