import Dashboard from "@/components/Dashboard";
import { MainNav } from "@/components/ui/main-nav";
import { Search } from "@/components/ui/search";
import { UserNav } from "@/components/ui/user-nav";

export const metadata = {
  title: "Dashboard",
  description: "Example dashboard app built using the components.",
};

export default function DashboardPage() {
  <div className="border-b">
    <div className="flex h-16 items-center px-4">
      <MainNav className="mx-6" />
      <div className="ml-auto flex items-center space-x-4">
        <Search />
        <UserNav />
      </div>
    </div>
  </div>;
  return <Dashboard />;
}
