import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RolesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return null;
}