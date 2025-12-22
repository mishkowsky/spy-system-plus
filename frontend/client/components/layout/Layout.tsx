import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Footer } from "./Footer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  FileText,
  Shield,
  Calendar,
  Settings,
  LogOut,
  Home,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (!user) {
    return null;
  }

  const navigation = [
    {
      name: t("navigation.dashboard"),
      href: "/dashboard",
      icon: Home,
      roles: [
        UserRole.CLIENT,
        UserRole.MANAGER,
        UserRole.SURVEILLANCE_OFFICER,
        UserRole.CORRECTIONS_OFFICER,
      ],
    },
    {
      name: t("navigation.clients"),
      href: "/clients",
      icon: Users,
      roles: [UserRole.MANAGER, UserRole.SURVEILLANCE_OFFICER],
    },
    {
      name: t("navigation.contracts"),
      href: "/contracts",
      icon: FileText,
      roles: [UserRole.CLIENT, UserRole.MANAGER],
    },
    {
      name: t("navigation.violations"),
      href: "/violations",
      icon: Shield,
      roles: [UserRole.SURVEILLANCE_OFFICER],
    },
    {
      name: t("navigation.tasks"),
      href: "/tasks",
      icon: Calendar,
      roles: [UserRole.CORRECTIONS_OFFICER],
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role),
  );

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = (name: string, surname: string) => {
    return `${name[0]}${surname[0]}`.toUpperCase();
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.CLIENT:
        return t("roles.client");
      case UserRole.MANAGER:
        return t("roles.manager");
      case UserRole.SURVEILLANCE_OFFICER:
        return t("roles.surveillanceOfficer");
      case UserRole.CORRECTIONS_OFFICER:
        return t("roles.correctionsOfficer");
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                {t("misc.appTitle")}
              </h1>
            </div>

            {/*/!* Navigation *!/*/}
            {/*<nav className="hidden md:flex space-x-8">*/}
            {/*  {filteredNavigation.map((item) => {*/}
            {/*    const Icon = item.icon;*/}
            {/*    const isActive = location.pathname === item.href;*/}
            {/*    return (*/}
            {/*      <Link*/}
            {/*        key={item.name}*/}
            {/*        to={item.href}*/}
            {/*        className={cn(*/}
            {/*          "inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors",*/}
            {/*          isActive*/}
            {/*            ? "border-primary text-primary"*/}
            {/*            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",*/}
            {/*        )}*/}
            {/*      >*/}
            {/*        <Icon className="mr-2 h-4 w-4" />*/}
            {/*        {item.name}*/}
            {/*      </Link>*/}
            {/*    );*/}
            {/*  })}*/}
            {/*</nav>*/}

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <NotificationCenter />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getUserInitials(
                          user.firstName || user.name || "U",
                          user.lastName || user.surname || "N",
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">

                        {user.firstName || user.name || t("misc.user")}{" "}
                        {user.lastName || user.surname || ""}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.senior ? "Старший менеджер" : getRoleDisplayName(user.role)}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      {t("navigation.profileSettings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("navigation.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full py-2 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">{children}</div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
