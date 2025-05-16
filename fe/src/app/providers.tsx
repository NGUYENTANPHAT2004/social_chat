'use client';

import { Provider } from 'react-redux';
import { SWRConfig } from 'swr';
import { store } from '@/store';
import axios from 'axios';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <SWRConfig
        value={{
          fetcher: (url: string) => axios.get(url).then((res) => res.data),
          revalidateOnFocus: false,
        }}
      >
        {children}
      </SWRConfig>
    </Provider>
  );
}