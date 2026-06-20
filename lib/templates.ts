export type TemplateColumn = {
  title: string;
  color: string;
  tasks: string[];
};

export type BoardTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  columns: TemplateColumn[];
};

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'sprint',
    name: 'Software Sprint',
    description: 'Agile workflow for dev teams',
    icon: 'Code2',
    columns: [
      { title: 'Backlog', color: '#94a3b8', tasks: [] },
      { title: 'To Do', color: '#7c3aed', tasks: ['Set up project', 'Create first feature', 'Review pull request'] },
      { title: 'In Progress', color: '#3b82f6', tasks: [] },
      { title: 'Review', color: '#f59e0b', tasks: [] },
      { title: 'Done', color: '#22c55e', tasks: [] },
    ],
  },
  {
    id: 'personal',
    name: 'Personal Productivity',
    description: 'Stay focused on what matters today',
    icon: 'Target',
    columns: [
      { title: 'Ideas', color: '#a78bfa', tasks: [] },
      { title: 'Today', color: '#f59e0b', tasks: ['Plan the week', 'Review priorities'] },
      { title: 'This Week', color: '#3b82f6', tasks: [] },
      { title: 'Completed', color: '#22c55e', tasks: [] },
    ],
  },
  {
    id: 'content',
    name: 'Content Planning',
    description: 'Plan, write, and publish content',
    icon: 'Layers',
    columns: [
      { title: 'Ideas', color: '#a78bfa', tasks: [] },
      { title: 'Drafting', color: '#f59e0b', tasks: ['Create content calendar', 'Write first draft'] },
      { title: 'Review', color: '#3b82f6', tasks: [] },
      { title: 'Published', color: '#22c55e', tasks: [] },
    ],
  },
  {
    id: 'client',
    name: 'Client Project',
    description: 'Manage deliverables and client feedback',
    icon: 'Briefcase',
    columns: [
      { title: 'Briefing', color: '#a78bfa', tasks: ['Gather requirements', 'Define scope'] },
      { title: 'In Progress', color: '#3b82f6', tasks: [] },
      { title: 'Waiting on Client', color: '#f59e0b', tasks: [] },
      { title: 'Delivered', color: '#22c55e', tasks: [] },
    ],
  },
  {
    id: 'blank',
    name: 'Blank Board',
    description: 'Start with a clean slate',
    icon: 'Kanban',
    columns: [],
  },
];
