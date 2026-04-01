import { TwoLevelSidebar } from "./sidebar-component";

export default function SidebarDemo() {
  return (
    <div className="flex h-screen bg-black">
      <TwoLevelSidebar onTabChange={(tab) => console.log("Tab changed to:", tab)} />
      <div className="flex-1 p-8 text-white">
        <h1 className="text-2xl font-semibold">Sidebar Demo Content</h1>
        <p className="mt-4 text-neutral-400">Select a section in the sidebar to see the interaction.</p>
      </div>
    </div>
  );
}
