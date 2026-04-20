import { useDesktopStore } from '../store/desktopStore';

export const useTheme = () => {
  const theme = useDesktopStore((state) => state.theme);
  const setTheme = useDesktopStore((state) => state.setTheme);
  return { theme, setTheme };
};
