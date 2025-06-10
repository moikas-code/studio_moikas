import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export function use_admin_status() {
  const { userId } = useAuth();
  const [is_admin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Check admin status
    fetch('/api/admin/check')
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.is_admin === true);
      })
      .catch(() => {
        setIsAdmin(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  return { is_admin, loading };
}