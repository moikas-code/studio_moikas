import React from "react";
import { Workflow, Settings, History, MoreVertical } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import CompactTokenDisplay from "@/app/components/CompactTokenDisplay";

interface HeaderProps {
  show_workflow_panel: boolean;
  set_show_workflow_panel: (show: boolean) => void;
  set_show_default_settings_modal: (show: boolean) => void;
  show_sessions_panel: boolean;
  set_show_sessions_panel: (show: boolean) => void;
  load_sessions: () => Promise<void>;
}

function Header({ 
  show_workflow_panel, 
  set_show_workflow_panel,
  set_show_default_settings_modal,
  show_sessions_panel,
  set_show_sessions_panel,
  load_sessions
}: HeaderProps) {
  const { user } = useUser();

  return (
    <div className="navbar min-h-12 bg-base-100 border-b">
      <div className="flex-none">
        <button
          onClick={() => set_show_workflow_panel(!show_workflow_panel)}
          className="btn btn-square btn-ghost btn-sm"
          title="Toggle Workflows Panel"
        >
          <Workflow className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1">
        <h1 className="text-lg font-bold">Workflow Chatbot</h1>
      </div>
      <div className="flex-none flex items-center gap-3">
        {/* Compact token display */}
        <CompactTokenDisplay className="hidden sm:flex" />
        
        {/* Dropdown menu for better mobile experience */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-square btn-ghost btn-sm">
            <MoreVertical className="w-4 h-4" />
          </div>
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-64 p-2 shadow">
            {/* Show user info and token info in dropdown on mobile */}
            <li className="sm:hidden mb-2">
              <div className="px-2 py-1">
                {user && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-base-300">
                    <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
                      {user.hasImage ? (
                        <img 
                          src={user.imageUrl} 
                          alt={user.fullName || user.firstName || "User"} 
                          className="w-full h-full object-cover"
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
              <button
                onClick={async () => {
                  if (!show_sessions_panel) {
                    await load_sessions();
                  }
                  set_show_sessions_panel(!show_sessions_panel);
                }}
                className="flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                Session History
              </button>
            </li>
            <li>
              <button
                onClick={() => set_show_default_settings_modal(true)}
                className="flex items-center gap-2"
              >
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