import FriendList from "./FriendList";
import GroupList from "./GroupList";
import NewMessageButton from "./NewMessageButton";
import SidebarHeader from "./SidebarHeader";
import UserProfile from "./UserProfile";

export default function Sidebar() {
  return (
    <aside className="h-screen w-85 bg-background border-r border-border text-foreground flex flex-col font-manrope antialiased tracking-tight z-50 shrink-0 overflow-y-auto light-scrollbar">
      <SidebarHeader />
      <NewMessageButton />
      <GroupList />
      <FriendList />
      <UserProfile />
    </aside>
  );
}
