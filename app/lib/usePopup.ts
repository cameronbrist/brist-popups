import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';

/** Current pop-up config and drop state, from the root loader. */
export function usePopup() {
  const data = useRouteLoaderData<RootLoader>('root');
  if (!data) throw new Error('usePopup must be used inside the root route');
  return {popup: data.popup, drop: data.drop};
}
