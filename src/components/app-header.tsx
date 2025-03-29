import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import useBasicState from "@/states/basic";
import { Link } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

export default function AppHeader() {
    const [pageHeaderNavigation] = useBasicState(
        useShallow((state) => [state.pageHeaderNavigation]),
    );

    const renderBreadcrumb = () => {
        const count = pageHeaderNavigation.length;
        const items: React.ReactNode[] = [];

        pageHeaderNavigation.forEach((item, index) => {
            if (index === count - 1) {
                items.push(
                    <BreadcrumbItem key={item.url}>
                        <BreadcrumbPage>{item.title}</BreadcrumbPage>
                    </BreadcrumbItem>,
                );
                return;
            }
            if (item.url) {
                items.push(
                    <BreadcrumbItem key={item.url}>
                        <Link to={item.url}>{item.title}</Link>
                    </BreadcrumbItem>,
                );
            }
            if (index !== count - 1) {
                items.push(
                    <BreadcrumbSeparator
                        className="hidden md:block"
                        key={item.url + "separator"}
                    />,
                );
            }
        });
        return items;
    };

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
                <BreadcrumbList>{renderBreadcrumb()}</BreadcrumbList>
            </Breadcrumb>
        </header>
    );
}
