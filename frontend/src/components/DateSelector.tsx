"use client";

import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useTaskStore } from '@/store/taskStore';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const CustomInput = forwardRef(({ value, onClick }: any, ref: any) => (
  <button
    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 hover:bg-zinc-800 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
    onClick={onClick}
    ref={ref}
  >
    <CalendarIcon size={18} className="text-indigo-400" />
    <span className="font-medium">{value}</span>
  </button>
));
CustomInput.displayName = 'CustomInput';

export default function DateSelector() {
  const selectedDate = useTaskStore((state) => state.selectedDate);
  const setSelectedDate = useTaskStore((state) => state.setSelectedDate);

  return (
    <div className="relative">
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => date && setSelectedDate(date)}
        customInput={<CustomInput />}
        dateFormat="MMMM d, yyyy"
        popperClassName="dark-theme-datepicker"
      />
    </div>
  );
}
