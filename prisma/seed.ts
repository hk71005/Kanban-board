import { PrismaClient, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clean up existing data
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.label.deleteMany();
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.boardMember.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleaned up existing data.');

  // Create User
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  });
  console.log(`Created user: ${user.email}`);

  // Create Board
  const board = await prisma.board.create({
    data: {
      title: 'Project Phoenix',
      emoji: '🚀',
      userId: user.id,
    },
  });
  console.log(`Created board: "${board.title}"`);

  // Add user as board owner
  await prisma.boardMember.create({
    data: {
      userId: user.id,
      boardId: board.id,
      role: 'OWNER',
    },
  });
  console.log(`Added ${user.email} as owner to "${board.title}"`);

  // Create Columns
  const columns = [
    { title: 'Backlog', color: '#f59e0b', order: 0 },
    { title: 'To Do', color: '#7c3aed', order: 1 },
    { title: 'In Progress', color: '#3b82f6', order: 2 },
    { title: 'Done', color: '#22c55e', order: 3 },
  ];

  const createdColumns = [];
  for (const col of columns) {
    const createdColumn = await prisma.column.create({
      data: {
        ...col,
        boardId: board.id,
      },
    });
    createdColumns.push(createdColumn);
    console.log(`Created column: "${createdColumn.title}"`);
  }

  // Create Tasks
  const tasks = [
    {
      columnId: createdColumns[0].id,
      title: 'Set up project repository',
      order: 0,
      priority: Priority.HIGH,
      storyPoints: 2,
    },
    {
      columnId: createdColumns[0].id,
      title: 'Design database schema',
      order: 1,
      priority: Priority.URGENT,
      storyPoints: 5,
      description: 'Define all models, fields, and relations for the application.',
    },
    {
      columnId: createdColumns[1].id,
      title: 'Implement user authentication',
      order: 0,
      priority: Priority.HIGH,
      storyPoints: 8,
      dueDate: new Date(),
    },
    {
      columnId: createdColumns[1].id,
      title: 'Create initial UI mockups',
      order: 1,
      priority: Priority.MEDIUM,
      storyPoints: 3,
    },
    {
      columnId: createdColumns[2].id,
      title: 'Develop API endpoints for boards',
      order: 0,
      priority: Priority.HIGH,
      storyPoints: 5,
      dueDate: new Date(new Date().setDate(new Date().getDate() - 2)), // Overdue
    },
    {
      columnId: createdColumns[3].id,
      title: 'Deploy staging environment',
      order: 0,
      priority: Priority.LOW,
      storyPoints: 3,
    },
  ];
  
  for (const taskData of tasks) {
      const task = await prisma.task.create({ data: taskData });
      console.log(`Created task: "${task.title}"`);

      if(task.title === 'Implement user authentication') {
          await prisma.subtask.createMany({
              data: [
                  { title: 'Add login page', completed: true, order: 0, taskId: task.id },
                  { title: 'Add registration page', completed: true, order: 1, taskId: task.id },
                  { title: 'Implement JWT strategy', completed: false, order: 2, taskId: task.id },
              ]
          });
          await prisma.label.createMany({
              data: [
                  { name: 'auth', color: '#ef4444', taskId: task.id },
                  { name: 'frontend', color: '#3b82f6', taskId: task.id },
              ]
          });
          await prisma.comment.create({
              data: {
                  content: 'We should use NextAuth v5 for this.',
                  userId: user.id,
                  taskId: task.id,
              }
          });
      }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });