import { create } from "zustand";

type AppState = {
  patientModalOpen: boolean;
  mobileNavigationOpen: boolean;
  setPatientModalOpen: (open: boolean) => void;
  setMobileNavigationOpen: (open: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  patientModalOpen: false,
  mobileNavigationOpen: false,
  setPatientModalOpen: (patientModalOpen) => set({ patientModalOpen }),
  setMobileNavigationOpen: (mobileNavigationOpen) => set({ mobileNavigationOpen }),
}));
