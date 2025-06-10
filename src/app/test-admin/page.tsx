export default function TestAdminPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Test Page</h1>
      <p>If you can see this page, the build is working.</p>
      <p className="mt-4">
        To set up admin access:
      </p>
      <ol className="list-decimal list-inside mt-2 space-y-2">
        <li>Run: <code className="bg-gray-100 px-2 py-1 rounded">bun run supabase:db:push</code></li>
        <li>Update your user in the database to have role = &apos;admin&apos;</li>
        <li>Visit <a href="/admin" className="text-blue-500 underline">/admin</a></li>
      </ol>
    </div>
  );
}