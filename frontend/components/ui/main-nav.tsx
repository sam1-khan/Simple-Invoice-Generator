import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      <Link
        href="/"
        className={cn(
          "text-sm transition-colors hover:text-primary",
          pathname === "/" ? "text-primary font-bold" : "text-muted-foreground"
        )}
      >
        Dashboard
      </Link>
      <Link
        href="/transactions"
        className={cn(
          "text-sm transition-colors hover:text-primary",
          pathname.startsWith("/transactions") ? "text-primary font-bold" : "text-muted-foreground"
        )}
      >
        Transactions
      </Link>
      <Link
        href="/clients"
        className={cn(
          "text-sm transition-colors hover:text-primary",
          pathname.startsWith("/clients") ? "text-primary font-bold" : "text-muted-foreground"
        )}
      >
        Clients
      </Link>
      <Link
        href="/settings"
        className={cn(
          "text-sm transition-colors hover:text-primary",
          pathname.startsWith("/settings") ? "text-primary font-bold" : "text-muted-foreground"
        )}
      >
        Settings
      </Link>
    </nav>
  );
}
