import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Dshop Gaming Store`;
  }, [title]);
}
