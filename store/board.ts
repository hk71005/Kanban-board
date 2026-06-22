import { create } from 'zustand';
import { Subtask } from '@prisma/client';
import { BoardWithDetails, ColumnWithTasks, CommentWithUser, TaskWithDetails } from '@/types';
import { Priority } from '@prisma/client';

type BoardState = {
  board: BoardWithDetails | null;
  columns: ColumnWithTasks[];
  activeTask: TaskWithDetails | null;
  currentUserId: string | null;
  searchQuery: string;
  priorityFilters: Priority[];
  assigneeFilter: string | null;
  isDragging: boolean;
  setBoard: (board: BoardWithDetails) => void;
  setCurrentUserId: (id: string) => void;
  setColumns: (columns: ColumnWithTasks[] | ((prev: ColumnWithTasks[]) => ColumnWithTasks[])) => void;
  setActiveTask: (task: TaskWithDetails | null) => void;
  setSearchQuery: (query: string) => void;
  setPriorityFilters: (priorities: Priority[]) => void;
  setAssigneeFilter: (userId: string | null) => void;
  setIsDragging: (value: boolean) => void;
  updateTaskInColumn: (updatedTask: TaskWithDetails) => void;
  addTaskToColumn: (newTask: TaskWithDetails) => void;
  deleteTaskFromColumn: (taskId: string, columnId: string) => void;
  deleteColumnFromStore: (columnId: string) => void;
  renameColumnInStore: (columnId: string, title: string) => void;
  updateSubtaskInStore: (taskId: string, subtaskId: string, data: { completed: boolean }) => void;
  addSubtaskToStore: (taskId: string, subtask: Subtask) => void;
  deleteSubtaskFromStore: (taskId: string, subtaskId: string) => void;
  addCommentToStore: (taskId: string, comment: CommentWithUser) => void;
  removeCommentFromStore: (taskId: string, commentId: string) => void;
};

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  columns: [],
  activeTask: null,
  currentUserId: null,
  searchQuery: '',
  priorityFilters: [],
  assigneeFilter: null,
  isDragging: false,
  setBoard: (board) => set({ board, columns: board.columns }),
  setCurrentUserId: (id) => set({ currentUserId: id }),
  setIsDragging: (value) => set({ isDragging: value }),
  setColumns: (columns) =>
    set((state) => ({
      columns: typeof columns === 'function' ? columns(state.columns) : columns,
    })),
  setActiveTask: (task) => set({ activeTask: task }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPriorityFilters: (priorities) => set({ priorityFilters: priorities }),
  setAssigneeFilter: (userId) => set({ assigneeFilter: userId }),
  updateTaskInColumn: (updatedTask) =>
    set((state) => ({
      columns: state.columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        ),
      })),
    })),
  addTaskToColumn: (newTask) =>
    set((state) => ({
      columns: state.columns.map((column) =>
        column.id === newTask.columnId
          ? { ...column, tasks: [...column.tasks, newTask] }
          : column
      ),
    })),
  deleteTaskFromColumn: (taskId, columnId) =>
    set((state) => ({
      columns: state.columns.map((column) =>
        column.id === columnId
          ? { ...column, tasks: column.tasks.filter((task) => task.id !== taskId) }
          : column
      ),
    })),
  deleteColumnFromStore: (columnId) =>
    set((state) => ({
      columns: state.columns.filter((col) => col.id !== columnId),
    })),
  renameColumnInStore: (columnId, title) =>
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId ? { ...col, title } : col
      ),
    })),
  updateSubtaskInStore: (taskId, subtaskId, data) =>
    set((state) => ({
      activeTask: state.activeTask?.id === taskId
        ? {
            ...state.activeTask,
            subtasks: state.activeTask.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, ...data } : st
            ),
          }
        : state.activeTask,
      columns: state.columns.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks.map((st) =>
                  st.id === subtaskId ? { ...st, ...data } : st
                ),
              }
            : t
        ),
      })),
    })),
  addSubtaskToStore: (taskId, subtask) =>
    set((state) => ({
      activeTask: state.activeTask?.id === taskId
        ? { ...state.activeTask, subtasks: [...state.activeTask.subtasks, subtask] }
        : state.activeTask,
      columns: state.columns.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: [...t.subtasks, subtask] }
            : t
        ),
      })),
    })),
  deleteSubtaskFromStore: (taskId, subtaskId) =>
    set((state) => ({
      activeTask: state.activeTask?.id === taskId
        ? {
            ...state.activeTask,
            subtasks: state.activeTask.subtasks.filter((st) => st.id !== subtaskId),
          }
        : state.activeTask,
      columns: state.columns.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.filter((st) => st.id !== subtaskId) }
            : t
        ),
      })),
    })),
  addCommentToStore: (taskId, comment) =>
    set((state) => ({
      activeTask: state.activeTask?.id === taskId
        ? { ...state.activeTask, comments: [comment, ...state.activeTask.comments] }
        : state.activeTask,
      columns: state.columns.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) =>
          t.id === taskId ? { ...t, comments: [comment, ...t.comments] } : t
        ),
      })),
    })),
  removeCommentFromStore: (taskId, commentId) =>
    set((state) => ({
      activeTask: state.activeTask?.id === taskId
        ? {
            ...state.activeTask,
            comments: state.activeTask.comments.filter((c) => c.id !== commentId),
          }
        : state.activeTask,
      columns: state.columns.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) =>
          t.id === taskId
            ? { ...t, comments: t.comments.filter((c) => c.id !== commentId) }
            : t
        ),
      })),
    })),
}));
