
// app/auth/signin/page.tsx
import { redirect } from 'next/navigation';
import { getAuthSessionFromServer } from '@/lib/authUtils';
import SignInForm from '@/components/SignInForm';

export default async function SignInPage() {
  // Check if user is already authenticated
  const session = await getAuthSessionFromServer();
  
  if (session) {
    if (session.accountsConfigured) {
      redirect('/'); // Go to main app
    } else {
      redirect('/auth/select-accounts'); // Go to account selection
    }
  }

  return <SignInForm />;
}
