"use client";

import { useEffect, useState } from 'react';
import { useTaskStore } from '@/store/taskStore';
import api from '@/lib/axios';
import DateSelector from '@/components/DateSelector';
import Board from '@/components/Board';
import { Task } from '@/types';
import { format } from 'date-fns';

export default function TasksPage() {
  const selectedDate = useTaskStore((state) => state.selectedDate);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await api.get(`/tasks/?date=${dateStr}`);
        setTasks(res.data);
      } catch (error) {
        console.error("Failed to fetch tasks", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [selectedDate]);

  return (
    <div className="p-8 h-screen flex flex-col">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Task Board
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Manage your daily quests.</p>
        </div>
        <DateSelector />
      </header>
      
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <Board initialTasks={tasks} setTasks={setTasks} />
        )}
      </div>
    </div>
  );
}
