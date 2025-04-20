import { User, Project, SmartGoal, Task, Comment } from '../types';
import { addDays, subDays } from 'date-fns';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Ahmed Mohammed',
    email: 'ahmed@example.com',
    role: 'student',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '2',
    name: 'Fatima Al-Zahraa',
    email: 'fatima@example.com',
    role: 'student',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '3',
    name: 'Dr. Layla Ibrahim',
    email: 'layla@example.com',
    role: 'teacher',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '4',
    name: 'Ibrahim Hassan',
    email: 'ibrahim@example.com',
    role: 'admin',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150'
  }
];

// Mock Smart Goals
export const mockGoals: SmartGoal[] = [
  {
    id: 'g1',
    projectId: 'p1',
    title: 'Build a Working Robot Prototype',
    specific: 'Design and construct a functioning robot that can navigate obstacles.',
    measurable: 'Robot can successfully navigate a predefined obstacle course with 90% accuracy.',
    achievable: 'We have the necessary components and technical skills within our team.',
    relevant: 'Directly applies robotics principles and engineering design concepts from our curriculum.',
    timeBound: {
      startDate: subDays(new Date(), 15),
      endDate: addDays(new Date(), 30)
    },
    progress: 40,
    assignees: ['1', '2'],
    createdBy: '3',
    createdAt: subDays(new Date(), 20),
    updatedAt: subDays(new Date(), 2)
  },
  {
    id: 'g2',
    projectId: 'p1',
    title: 'Complete Environmental Analysis',
    specific: 'Conduct a comprehensive analysis of local water quality.',
    measurable: 'Collect and test 20 water samples from different locations and document findings.',
    achievable: 'We have access to necessary testing equipment through school lab.',
    relevant: 'Addresses environmental science curriculum objectives on water pollution.',
    timeBound: {
      startDate: subDays(new Date(), 10),
      endDate: addDays(new Date(), 15)
    },
    progress: 65,
    assignees: ['1'],
    createdBy: '3',
    createdAt: subDays(new Date(), 12),
    updatedAt: yesterday()
  },
  {
    id: 'g3',
    projectId: 'p2',
    title: 'Develop Mobile App Prototype',
    specific: 'Create a functioning mobile app prototype for science education.',
    measurable: 'App includes 5 interactive lessons with assessment capabilities.',
    achievable: 'Team includes members with app development experience.',
    relevant: 'Addresses need for engaging digital learning tools in STEM education.',
    timeBound: {
      startDate: subDays(new Date(), 30),
      endDate: addDays(new Date(), 10)
    },
    progress: 80,
    assignees: ['2'],
    createdBy: '3',
    createdAt: subDays(new Date(), 35),
    updatedAt: subDays(new Date(), 1)
  }
];

// Mock Projects
export const mockProjects: Project[] = [
  {
    id: 'p1',
    title: 'Environmental Monitoring Robot',
    description: 'Building a robot that can navigate and collect environmental data from hard-to-reach areas.',
    category: 'Robotics & Environmental Science',
    goals: mockGoals.filter(goal => goal.projectId === 'p1'),
    members: [
      { userId: '1', role: 'leader' },
      { userId: '2', role: 'member' },
      { userId: '3', role: 'member' }
    ],
    createdBy: '3',
    createdAt: subDays(new Date(), 45),
    updatedAt: yesterday()
  },
  {
    id: 'p2',
    title: 'Interactive STEM Learning App',
    description: 'Creating a mobile application to help students learn STEM concepts through interactive activities.',
    category: 'Educational Technology',
    goals: mockGoals.filter(goal => goal.projectId === 'p2'),
    members: [
      { userId: '2', role: 'leader' },
      { userId: '3', role: 'member' }
    ],
    createdBy: '3',
    createdAt: subDays(new Date(), 60),
    updatedAt: subDays(new Date(), 3)
  }
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 't1',
    goalId: 'g1',
    title: 'Design robot chassis',
    description: 'Create 3D design of robot chassis that can house all components.',
    status: 'completed',
    dueDate: subDays(new Date(), 5),
    assignee: '1',
    createdBy: '3',
    createdAt: subDays(new Date(), 15),
    updatedAt: subDays(new Date(), 6)
  },
  {
    id: 't2',
    goalId: 'g1',
    title: 'Program obstacle detection',
    description: 'Write code for sensors to detect obstacles in path.',
    status: 'in-progress',
    dueDate: addDays(new Date(), 3),
    assignee: '2',
    createdBy: '3',
    createdAt: subDays(new Date(), 10),
    updatedAt: yesterday()
  },
  {
    id: 't3',
    goalId: 'g2',
    title: 'Collect water samples',
    description: 'Collect 20 water samples from designated locations.',
    status: 'completed',
    dueDate: subDays(new Date(), 2),
    assignee: '1',
    createdBy: '3',
    createdAt: subDays(new Date(), 9),
    updatedAt: subDays(new Date(), 3)
  },
  {
    id: 't4',
    goalId: 'g2',
    title: 'Analyze pH levels',
    description: 'Test all samples for pH levels and document results.',
    status: 'in-progress',
    dueDate: addDays(new Date(), 1),
    assignee: '1',
    createdBy: '3',
    createdAt: subDays(new Date(), 5),
    updatedAt: yesterday()
  },
  {
    id: 't5',
    goalId: 'g3',
    title: 'Design app interface',
    description: 'Create wireframes for all app screens.',
    status: 'completed',
    dueDate: subDays(new Date(), 10),
    assignee: '2',
    createdBy: '3',
    createdAt: subDays(new Date(), 25),
    updatedAt: subDays(new Date(), 15)
  },
  {
    id: 't6',
    goalId: 'g3',
    title: 'Develop interactive lessons',
    description: 'Code 5 interactive science lessons with animations.',
    status: 'in-progress',
    dueDate: addDays(new Date(), 5),
    assignee: '2',
    createdBy: '3',
    createdAt: subDays(new Date(), 20),
    updatedAt: yesterday()
  }
];

// Mock Comments
export const mockComments: Comment[] = [
  {
    id: 'c1',
    parentId: 'g1',
    parentType: 'goal',
    content: 'We might need to reconsider the materials for the chassis due to weight constraints.',
    author: '1',
    createdAt: subDays(new Date(), 5)
  },
  {
    id: 'c2',
    parentId: 'g1',
    parentType: 'goal',
    content: 'Good point. Let\'s look into using carbon fiber instead of aluminum.',
    author: '3',
    createdAt: subDays(new Date(), 4)
  },
  {
    id: 'c3',
    parentId: 't3',
    parentType: 'task',
    content: 'All samples have been collected. Moving on to testing phase.',
    author: '1',
    createdAt: subDays(new Date(), 3)
  },
  {
    id: 'c4',
    parentId: 'p2',
    parentType: 'project',
    content: 'Make sure we focus on making the app accessible for students with disabilities.',
    author: '3',
    createdAt: subDays(new Date(), 7)
  }
];

// Helper function for dates
function yesterday() {
  return subDays(new Date(), 1);
}