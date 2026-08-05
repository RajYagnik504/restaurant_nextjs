import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/auth';
import ClientLayoutWrapper from './ClientLayoutWrapper';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get('token')?.value;
  let role = 'guest';

  if (token) {
    try {
      const decoded = await verifyJwt(token);
      if (decoded && typeof decoded === 'object' && decoded.role) {
        role = decoded.role as string;
      }
    } catch (err) {
      console.warn("Invalid token in layout");
    }
  }

  return (
    <ClientLayoutWrapper role={role}>
      {children}
    </ClientLayoutWrapper>
  );
}
