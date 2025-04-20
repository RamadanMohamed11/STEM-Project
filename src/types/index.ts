export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SmartGoal {
  id: string;
  user_id: string;
  project_id: string;
  group_id?: string;
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  time_bound_start: string;
  time_bound_end: string;
  start_date: string; // Date when the goal should start
  progress: number;
  approval_status?: 'pending' | 'approved' | 'rejected';
  teacher_feedback?: string;
  teacher_id?: string;
  achieved?: boolean;
  achieved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  group_id?: string;
  title: string;
  description: string;
  category: string;
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  dueDate: Date;
  assignee: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  parentId: string; // could be projectId, goalId, or taskId
  parentType: 'project' | 'goal' | 'task';
  content: string;
  author: string;
  createdAt: Date;
}

export interface GroupResource {
  id: string;
  group_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  resource_type: 'file' | 'link' | 'template' | 'video' | 'article' | 'other';
  url?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
}