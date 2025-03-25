import * as React from "react";
import { AppSwitcher } from "@/components/app-switcher";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarFooter,
} from "@/components/ui/sidebar";
import { AppUser } from "@/components/app-user";
import useBasicState from "@/states/basic";
import { useShallow } from "zustand/react/shallow";
import { useI18n } from "@/i18n";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const location = useLocation();
    const [apps, mainNav] = useBasicState(
        useShallow((state) => [state.apps, state.mainNav]),
    );
    const sidebarI18n = useI18n("sidebar");
    const isActive = (url: string) => {
        return url === location.pathname;
    };

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <AppSwitcher apps={apps} defaultApp={apps[0]} />
            </SidebarHeader>
            <SidebarContent>
                {mainNav.map((item) => (
                    <SidebarGroup key={item.title}>
                        <SidebarGroupLabel>
                            {<item.icon className="mr-1" />}
                            {sidebarI18n(item.title)}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {item.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive(item.url)}
                                        >
                                            <Link to={item.url}>
                                                {sidebarI18n(item.title)}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarRail />
            <SidebarFooter>
                <AppUser />
            </SidebarFooter>
        </Sidebar>
    );
}
