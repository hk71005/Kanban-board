import { getInvite } from '@/actions/invite';
import RegisterForm from './RegisterForm';

interface RegisterPageProps {
  searchParams: Promise<{ invite?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { invite: token } = await searchParams;

  let inviteData: { token: string; email: string; boardTitle: string; inviterName: string } | null = null;

  if (token) {
    const result = await getInvite(token);
    if (!('error' in result)) {
      inviteData = {
        token,
        email: result.email,
        boardTitle: result.boardTitle,
        inviterName: result.inviterName,
      };
    }
  }

  return <RegisterForm inviteData={inviteData} />;
}
