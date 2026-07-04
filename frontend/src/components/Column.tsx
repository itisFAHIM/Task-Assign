"use client";

import { useDroppable } from '@dnd-kit/core';
import { Task } from '@/types';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import TaskModal from './TaskModal';

interface ColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  setTasks: any;
}

export default function Column({ id, title, tasks, setTasks }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex-1 min-w-[300px] flex flex-col bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl h-full">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80 rounded-t-2xl">
        <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
          {title}
          <span className="text-xs font-normal bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-zinc-400 hover:text-indigo-400 hover:bg-indigo-400/10 p-1.5 rounded-lg transition-all"
        >
          <Plus size={18} />
        </button>
      </div>

      <div 
        ref={setNodeRef} 
        className={`flex-1 p-4 overflow-y-auto space-y-3 transition-colors ${isOver ? 'bg-zinc-800/50' : ''}`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} setTasks={setTasks} />
        ))}
      </div>

      {isModalOpen && (
        <TaskModal 
          onClose={() => setIsModalOpen(false)} 
          status={id as Task['status']}
          setTasks={setTasks}
        />
      )}
    </div>
  );
}
