import { redirect } from 'next/navigation';
import { check_admin_access } from '@/lib/utils/api/admin';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin_check = await check_admin_access();
  
  if (!admin_check.is_admin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Admin Navigation */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <Link href="/admin" className="btn btn-ghost text-xl">
            Admin Dashboard
          </Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link href="/admin">
                Overview
              </Link>
            </li>
            <li>
              <Link href="/admin/users">
                Users
              </Link>
            </li>
            <li>
              <Link href="/admin/usage">
                Usage
              </Link>
            </li>
            <li>
              <Link href="/admin/revenue">
                Revenue
              </Link>
            </li>
            <li>
              <Link href="/admin/models">
                Models
              </Link>
            </li>
            <li>
              <Link href="/admin/embeddings">
                Embeddings
              </Link>
            </li>
            <li>
              <Link href="/" className="text-error">
                Exit Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}