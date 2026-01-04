// src/lib/LocationContext.tsx
import React, { createContext, Dispatch, SetStateAction, useContext, useState } from 'react';

interface Location {
  lat: number;
  lng: number;
  radio: number;
}

interface LocationContextType {
  location: Location;
  setLocation: Dispatch<SetStateAction<Location>>;
}


const LocationContext = createContext<LocationContextType | null>(null);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocation] = useState<Location>({
    lat: 0,
    lng: 0,
    radio: 5,
  });

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used inside LocationProvider');
  }
  return ctx;
};
