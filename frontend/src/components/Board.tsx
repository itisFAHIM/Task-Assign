"use client";

import { useState } from 'react';
import { Task } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import Column from './Column';
import TaskCard from './TaskCard';
import api from '@/lib/axios';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export default function Board({ initialTasks, setTasks }: { initialTasks: Task[], setTasks: any }) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = initialTasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Determine the destination status based on what we dropped over.
    // If dropped over a column, overId is column id. If over a task, find the task's status.
    let targetStatus = overId as Task['status'];
    const overTask = initialTasks.find(t => t.id === overId);
    if (overTask) {
      targetStatus = overTask.status;
    } else if (!COLUMNS.find(c => c.id === overId)) {
      return;
    }

    const activeTask = initialTasks.find(t => t.id === activeId);
    if (!activeTask || activeTask.status === targetStatus) return;

    // Optimistic update
    const previousTasks = [...initialTasks];
    setTasks((tasks: Task[]) => tasks.map(t => t.id === activeId ? { ...t, status: targetStatus } : t));

    try {
      await api.patch(`/tasks/${activeId}/`, { status: targetStatus });
    } catch (error) {
      console.error("Failed to update task status", error);
      // Revert on failure
      setTasks(previousTasks);
    }
  };

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map((col) => {
          const colTasks = initialTasks.filter((t) => t.status === col.id);
          return (
            <SortableContext key={col.id} items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <Column id={col.id} title={col.title} tasks={colTasks} setTasks={setTasks} />
            </SortableContext>
          );
        })}
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
