"use client";

import { useState } from 'react';
import { Task } from '@/types';
import api from '@/lib/axios';
import { X, Trash2 } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { format } from 'date-fns';

interface TaskModalProps {
  task?: Task;
  status?: Task['status'];
  onClose: () => void;
  setTasks: any;
}

export default function TaskModal({ task, status, onClose, setTasks }: TaskModalProps) {
  const selectedDate = useTaskStore((state) => state.selectedDate);
  const isEditing = !!task;

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium');
  const [taskStatus, setTaskStatus] = useState<Task['status']>(task?.status || status || 'todo');
  const [tags, setTags] = useState(task?.tags || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const taskData = {
      title,
      description,
      priority,
      tags,
      status: taskStatus,
      due_date: format(selectedDate, 'yyyy-MM-dd'),
    };

    try {
      if (isEditing) {
        const res = await api.put(`/tasks/${task.id}/`, taskData);
        setTasks((prev: Task[]) => prev.map(t => t.id === task.id ? res.data : t));
      } else {
        const res = await api.post('/tasks/', taskData);
        setTasks((prev: Task[]) => [...prev, res.data]);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save task", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    setLoading(true);
    try {
      await api.delete(`/tasks/${task.id}/`);
      setTasks((prev: Task[]) => prev.filter(t => t.id !== task.id));
      onClose();
    } catch (error) {
      console.error("Failed to delete task", error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-100">{isEditing ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors resize-none h-24"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Status</label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value as Task['status'])}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-zinc-400">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="design, frontend..."
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete
              </button>
            ) : <div></div>}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
