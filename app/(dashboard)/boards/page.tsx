import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart3, CheckSquare, Clock, Columns3, Rocket, Users, Users2 } from 'lucide-react';
import CreateBoardDialog from '@/components/board/CreateBoardDialog';
import BoardIcon from '@/components/shared/BoardIcon';

const featureCards = [
  {
    icon: <Rocket className="w-5 h-5" />,
    title: 'Organize',
    desc: 'Create boards and columns for any workflow',
    borderColor: '#7c3aed',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
  {
    icon: <Users2 className="w-5 h-5" />,
    title: 'Collaborate',
    desc: 'Invite members and assign tasks',
    borderColor: '#3b82f6',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Track',
    desc: 'Monitor progress with live indicators',
    borderColor: '#22c55e',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-500',
  },
];

export default async function BoardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const boards = await db.board.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { columns: true, members: true } },
      columns: {
        select: { color: true, _count: { select: { tasks: true } } },
        orderBy: { order: 'asc' },
      },
    },
  });

  const totalTasks = (columns: { _count: { tasks: number } }[]) =>
    columns.reduce((sum, col) => sum + col._count.tasks, 0);

  if (boards.length === 0) {
    return (
      <div
        className="container flex flex-col items-center justify-center min-h-[80vh] py-16 text-center"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(262 84% 58% / 0.07), transparent)' }}
      >
        {/* Kanban hero icon */}
        <div className="flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary" aria-hidden="true">
            {/* Col 1: To Do — lighter, waiting */}
            <rect x="3" y="3" width="12" height="38" rx="3" fill="currentColor" fillOpacity="0.08"/>
            <rect x="4" y="6" width="10" height="7" rx="2.5" fill="currentColor" fillOpacity="0.65"/>
            <rect x="4" y="16" width="10" height="7" rx="2.5" fill="currentColor" fillOpacity="0.35"/>
            <rect x="4" y="26" width="10" height="12" rx="2" fill="currentColor" fillOpacity="0.18"/>
            {/* Col 2: In Progress — dominant, full weight */}
            <rect x="16" y="3" width="12" height="38" rx="3" fill="currentColor" fillOpacity="0.08"/>
            <rect x="17" y="6" width="10" height="15" rx="2.5" fill="currentColor"/>
            <rect x="17" y="24" width="10" height="9" rx="2.5" fill="currentColor" fillOpacity="0.55"/>
            <rect x="17" y="36" width="10" height="4" rx="2" fill="currentColor" fillOpacity="0.25"/>
            {/* Col 3: Done — lightest, completed */}
            <rect x="29" y="3" width="12" height="38" rx="3" fill="currentColor" fillOpacity="0.08"/>
            <rect x="30" y="6" width="10" height="9" rx="2.5" fill="currentColor" fillOpacity="0.38"/>
            <rect x="30" y="18" width="10" height="7" rx="2.5" fill="currentColor" fillOpacity="0.2"/>
            <rect x="30" y="28" width="10" height="11" rx="2" fill="currentColor" fillOpacity="0.1"/>
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-2">Welcome to Kanvi</h2>
        <p className="text-lg font-medium text-muted-foreground mb-8">Plan. Track. Deliver.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-2xl w-full">
          {featureCards.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-2 p-5 rounded-xl bg-card border border-border"
              style={{ borderTop: `2px solid ${f.borderColor}` }}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${f.iconBg} ${f.iconColor}`}>
                {f.icon}
              </div>
              <p className="font-semibold text-sm">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <CreateBoardDialog />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Boards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {boards.length} {boards.length === 1 ? 'board' : 'boards'}
          </p>
        </div>
        <CreateBoardDialog />
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {boards.map((board) => {
          const accentColor = board.columns[0]?.color ?? '#7c3aed';
          const taskCount = totalTasks(board.columns);
          const colorDots = board.columns.slice(0, 3);
          return (
            <Link href={`/boards/${board.id}`} key={board.id} className="group">
              <Card className="transition-all duration-200 ease-in-out hover:border-primary hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 h-full flex flex-col overflow-hidden">
                <div className="h-1 w-full shrink-0" style={{ backgroundColor: accentColor }} />
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2.5 text-base">
                    <BoardIcon emoji={board.emoji} size="sm" />
                    <span className="truncate">{board.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0 space-y-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    <CheckSquare className="w-3 h-3" />
                    {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                  </span>
                  {colorDots.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {colorDots.map((col, i) => (
                        <div
                          key={i}
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: col.color }}
                          title={`Column ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-2 text-xs text-muted-foreground border-t pt-3 mt-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Columns3 className="w-3 h-3" />
                      {board._count.columns} {board._count.columns === 1 ? 'column' : 'columns'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {board._count.members} {board._count.members === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}
                  </span>
                </CardFooter>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
