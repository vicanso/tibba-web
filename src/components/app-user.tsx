"use client";
import {
    BellIcon,
    CreditCardIcon,
    LogOutIcon,
    MoreVerticalIcon,
    UserCircleIcon,
    Loader2Icon,
    LogInIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import useUserState from "@/states/user";
import { useAsync } from "react-async-hook";
import { useShallow } from "zustand/react/shallow";
import { useI18n } from "@/i18n";
import { toast } from "sonner";
import { formatError } from "@/helpers/util";
import { Link } from "react-router-dom";
import { LOGIN } from "@/constants/route";
export function AppUser() {
    const commonI18n = useI18n("common");
    const [initialized, fetch, userInfo, logout] = useUserState(
        useShallow((state) => [
            state.initialized,
            state.fetch,
            state.data,
            state.logout,
        ]),
    );

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            toast.error(formatError(err));
        }
    };

    useAsync(async () => {
        try {
            await fetch();
        } catch (err) {
            toast.error(formatError(err));
        }
    }, []);
    const { isMobile } = useSidebar();
    let container = <></>;
    if (!initialized) {
        container = (
            <div className="flex items-center justify-center">
                <Loader2Icon className="size-4 animate-spin" />
                <span className="ml-2">{commonI18n("loading")}</span>
            </div>
        );
    } else if (!userInfo.account) {
        container = (
            <Button variant="outline" size="lg" className="w-full">
                <Link
                    to={LOGIN}
                    className="w-full flex items-center justify-center gap-2"
                >
                    <LogInIcon />
                    Login
                </Link>
            </Button>
        );
    } else {
        container = (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                        <Avatar className="h-8 w-8 rounded-lg grayscale">
                            <AvatarImage
                                src={userInfo.avatar}
                                alt={userInfo.account}
                            />
                            <AvatarFallback className="rounded-lg">
                                CN
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">
                                {userInfo.account}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                                {userInfo.email}
                            </span>
                        </div>
                        <MoreVerticalIcon className="ml-auto size-4" />
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align="end"
                    sideOffset={4}
                >
                    <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={userInfo.avatar}
                                    alt={userInfo.account}
                                />
                                <AvatarFallback className="rounded-lg">
                                    CN
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {userInfo.account}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {userInfo.email}
                                </span>
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <UserCircleIcon />
                            Account
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <CreditCardIcon />
                            Billing
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <BellIcon />
                            Notifications
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOutIcon />
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }
    return (
        <SidebarMenu>
            <SidebarMenuItem>{container}</SidebarMenuItem>
        </SidebarMenu>
    );
}
