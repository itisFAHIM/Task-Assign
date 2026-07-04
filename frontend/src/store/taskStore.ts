import { create } from 'zustand';

interface TaskState {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
