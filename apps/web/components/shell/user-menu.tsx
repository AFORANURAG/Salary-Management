"use client";

import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@salary-mgmt/ui";
import { postLogout } from "@salary-mgmt/store";
import { useQueryClient } from "@salary-mgmt/store/query";
import { queryKeys } from "@salary-mgmt/store/query";
import { useSessionContext } from "@/components/session-provider";
import type { HrUserRole } from "@salary-mgmt/types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("");
}

function roleBadgeVariant(role: HrUserRole): "destructive" | "default" | "secondary" {
  if (role === "ADMIN") return "destructive";
  if (role === "HR_MANAGER") return "default";
  return "secondary";
}

export function UserMenu(): React.JSX.Element {
  const { user } = useSessionContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  const initials = user ? getInitials(user.name) : "?";

  async function handleSignOut(): Promise<void> {
    await postLogout().catch(() => undefined);
    queryClient.removeQueries({ queryKey: queryKeys.session.all() });
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="user-menu-trigger"
          aria-label="User menu"
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-8 w-8 bg-primary text-primary-foreground cursor-pointer">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {user && (
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-2.5 py-1">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1 min-w-0">
                <span
                  data-testid="user-menu-name"
                  className="text-sm font-semibold leading-none truncate"
                >
                  {user.name}
                </span>
                <Badge
                  data-testid="user-menu-role-badge"
                  variant={roleBadgeVariant(user.role)}
                  className="w-fit text-[10px] px-1.5 py-0"
                >
                  {user.role}
                </Badge>
              </div>
            </div>
          </DropdownMenuLabel>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a href="/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            My Profile
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          data-testid="sign-out-item"
          className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2 cursor-pointer"
          onSelect={() => void handleSignOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
