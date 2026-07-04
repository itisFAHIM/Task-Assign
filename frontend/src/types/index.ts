export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  tags: string;
  order: number;
}

export interface PolygonType {
  id: number;
  points: { x: number; y: number }[];
  image: number;
  label?: string;
}

export interface ImageType {
  id: number;
  file: string;
  polygons: PolygonType[];
}
