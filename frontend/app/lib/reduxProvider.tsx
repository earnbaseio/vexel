"use client";

import { store } from "./store";
import { Provider } from "react-redux";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import { useState, useEffect } from "react";

const persistor = persistStore(store); // persist the store

// Loading component
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-500"></div>
  </div>
);

export default function ReduxProvider(props: React.PropsWithChildren) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Always use PersistGate to prevent race conditions
  // Show loading during SSR and rehydration
  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        {isClient ? props.children : <Loading />}
      </PersistGate>
    </Provider>
  );
}
