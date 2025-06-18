import React from "react";
import Image from "next/image";
import { Workflow, Settings, History, MoreVertical } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import CompactTokenDisplay from "@/components/CompactTokenDisplay";
import { workflow } from "../types";

interface HeaderProps {
  selected_workflow?: workflow;
  on_workflow_settings: () => void;
  on_new_workflow: () => void;
  on_new_session: () => void;
  on_view_templates: () => void;
  on_default_settings: () => void;
  on_view_history: () => void;
  show_history: boolean;
}

function Header({ on_workflow_settings, on_default_settings, on_view_history }: HeaderProps) {
  const { user } = useUser();

  return (
    <div className="navbar min-h-12 bg-base-100 border-b">
      <div className="flex-none">
        <button
          onClick={on_workflow_settings}
          className="btn btn-square btn-ghost btn-sm"
          title="Workflow Settings"
        >
          <Workflow className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1">
        <h1 className="text-lg font-bold">MEMU</h1>
      </div>
      <div className="flex-none flex items-center gap-3">
        {/* Compact token display */}
        <CompactTokenDisplay className="hidden sm:flex" />

        {/* Dropdown menu for better mobile experience */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-square btn-ghost btn-sm">
            <MoreVertical className="w-4 h-4" />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-[1] w-64 p-2 shadow"
          >
            {/* Show user info and token info in dropdown on mobile */}
            <li className="sm:hidden mb-2">
              <div className="px-2 py-1">
                {user && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-base-300">
                    <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center overflow-hidden relative">
                      {user.hasImage ? (
                        <Image
                          src={user.imageUrl}
                          alt={user.fullName || user.firstName || "User"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium">
                          {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || "U"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {user.fullName || user.firstName || "User"}
                      </div>
                      <div className="text-xs text-base-content/60 truncate">
                        {user.primaryEmailAddress?.emailAddress}
                      </div>
                    </div>
                  </div>
                )}
                <CompactTokenDisplay show_breakdown={true} />
              </div>
            </li>
            <li>
              <button onClick={on_view_history} className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Session History
              </button>
            </li>
            <li>
              <button onClick={on_default_settings} className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Chat Settings
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Header;
