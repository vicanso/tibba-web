import { create } from "zustand";
export interface PageNavigation {
    url?: string;
    icon?: React.JSX.Element;
    title: string;
}

const pageHeaderNavigation: PageNavigation[] = [];

interface BasicState {
    apps: string[];
    pageHeaderNavigation: PageNavigation[];
    setPageHeaderNavigation: (nav: PageNavigation[]) => void;
    resetPageHeaderNavigation: () => void;
    setTitle: (title: string) => void;
}

const useBasicState = create<BasicState>((set) => ({
    apps: ["Tibba Web", "Tibba Admin"],
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
