import Image from "next/image";
import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <div>
      <nav className="navbar bg-base-100 shadow-md px-4">
        <div className="flex-1">
          <span className="text-xl font-bold">Studio App</span>
        </div>
        <div className="flex-none gap-2">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in">
              <button className="btn btn-primary">Sign In</button>
            </Link>
          </SignedOut>
        </div>
      </nav>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold">Welcome to the Studio App</h1>
      </div>
    </div>
  );
}
