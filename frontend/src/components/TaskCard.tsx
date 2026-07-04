"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';
import { GripVertical, Clock, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import TaskModal from './TaskModal';
import api from '@/lib/axios';

const PRIORITY_COLORS = {
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function TaskCard({ task, setTasks }: { task: Task, setTasks?: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const tags = task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!setTasks) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${task.id}/`);
      setTasks((prev: Task[]) => prev.filter(t => t.id !== task.id));
    } catch (err) {
      console.error('Delete failed', err);
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-lg group relative transition-all ${isDragging ? 'ring-2 ring-indigo-500 shadow-2xl' : 'hover:border-zinc-700'}`}
      >
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete task"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
          >
            <Trash2 size={13} />
          </button>

          <div 
            className="p-1.5 rounded-lg cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={13} />
          </div>
        </div>

        <div onClick={() => setIsModalOpen(true)} className="cursor-pointer pr-12">
          <div className="flex gap-2 mb-2">
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
          </div>
          
          <h3 className="text-sm font-medium text-zinc-100 mb-1 line-clamp-2">{task.title}</h3>
          
          <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500">
            {task.due_date && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag size={12} />
                <span>{tags.length} tag{tags.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && setTasks && (
        <TaskModal 
          task={task} 
          onClose={() => setIsModalOpen(false)} 
          setTasks={setTasks}
        />
      )}
    </>
  );
}
