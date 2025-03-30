import { create } from "zustand";
import { Users } from "lucide-react";
import { USER, LOGIN_HISTORY, HOME } from "@/constants/route";
const mainNav = [
    {
        title: "userFeature",
        icon: Users,
        url: "#",
        items: [
            {
                title: "HOME",
                url: HOME,
            },
            {
                title: "user",
                url: USER,
            },
            {
                title: "loginHistory",
                url: LOGIN_HISTORY,
            },
        ],
    },
];

export interface PageNavigation {
    url?: string;
    icon?: React.JSX.Element;
    title: string;
}

const pageHeaderNavigation: PageNavigation[] = [];

interface BasicState {
    apps: string[];
    mainNav: typeof mainNav;
    pageHeaderNavigation: PageNavigation[];
    setPageHeaderNavigation: (nav: PageNavigation[]) => void;
    resetPageHeaderNavigation: () => void;
    setTitle: (title: string) => void;
}

const useBasicState = create<BasicState>((set) => ({
    apps: ["Tibba Web", "Tibba Admin"],
    mainNav,
    pageHeaderNavigation,
    setTitle: (title: string) => {
        set({
            pageHeaderNavigation: [
                {
                    title,
                },
            ],
        });
    },
    setPageHeaderNavigation: (nav: PageNavigation[]) => {
        set({
            pageHeaderNavigation: nav,
        });
    },
    resetPageHeaderNavigation: () => {
        set({
            pageHeaderNavigation: [],
        });
    },
}));

export default useBasicState;
