// app/auth/select-accounts/page.tsx
import { redirect } from 'next/navigation';
import { getAuthSessionFromServer } from '@/lib/authUtils';
import AccountSelection from '@/components/AccountSelection';

interface AuthSession {
  userId: string;
  email: string;
  name: string;
  picture: string;
  accountsConfigured?: boolean;
}

export default async function SelectAccountsPage() {
  const session = await getAuthSessionFromServer();
  
  if (!session) {
    redirect('/auth/signin');
  }
  
  if (session.accountsConfigured) {
    redirect('/');
  }

  return (
    <AccountSelection 
      user={{
        email: session.email,
        name: session.name,
        picture: session.picture
      }}
    />
  );
}