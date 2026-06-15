import { Board, Column, Task, Label, Subtask, User, Comment, BoardMember } from '@prisma/client';

export type SubtaskWithCompletion = Subtask & { completed: boolean };

export type LabelWithTask = Label & { task: Task };

export type CommentWithUser = Comment & { user: Pick<User, 'id' | 'name' | 'email'> };

export type TaskWithDetails = Task & {
  labels: Label[];
  subtasks: Subtask[];
  comments: CommentWithUser[];
  column: {
    title: string;
  };
};

export type ColumnWithTasks = Column & {
  tasks: TaskWithDetails[];
};

export type BoardMemberWithUser = BoardMember & {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

export type BoardWithDetails = Board & {
  columns: ColumnWithTasks[];
  members: BoardMemberWithUser[];
  user: Pick<User, 'id' | 'name'>;
};

export type DraggableTask = {
  id: string;
  columnId: string;
};