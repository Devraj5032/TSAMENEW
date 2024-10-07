"use client"; // Ensures this component is only used on the client side
import { Provider } from "react-redux";
import store, { persistor } from "../lib/store"; // Import store and persistor
import { PersistGate } from "redux-persist/integration/react"; // PersistGate ensures state is rehydrated

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
