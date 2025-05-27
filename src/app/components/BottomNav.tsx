import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Brush } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 w-full z-20 md:hidden flex items-center justify-center bg-transparent pointer-events-none">
      <div className="flex w-full max-w-md mx-auto bg-base-200 rounded-2xl shadow-lg border border-base-300 px-2 py-1 mb-2 pointer-events-auto">
        <Link href="/tools" className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-150 group" aria-label="Home">
          <Home className={`w-6 h-6 mb-0.5 ${pathname === "/tools" ? "text-jade" : "text-base group-hover:text-jade"}`} />
          <span className={`text-xs ${pathname === "/tools" ? "text-jade font-semibold" : "text-base group-hover:text-jade"}`}>Home</span>
        </Link>
        <Link href="/tools/create" className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-150 group" aria-label="Image Generator">
          <Brush className={`w-6 h-6 mb-0.5 ${pathname === "/tools/create" ? "text-jade" : "text-base group-hover:text-jade"}`} />
          <span className={`text-xs ${pathname === "/tools/create" ? "text-jade font-semibold" : "text-base group-hover:text-jade"}`}>Create</span>
        </Link>
      </div>
    </nav>
  );
} 