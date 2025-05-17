import { create } from "zustand";
import request from "@/helpers/request";
import sha256 from "crypto-js/sha256";
import {
    UsersIcon,
    LucideIcon,
    LogInIcon,
    FileIcon,
    HomeIcon,
    CogIcon,
    LandPlotIcon,
} from "lucide-react";
import { HOME, LOGIN_HISTORY, MODEL } from "@/constants/route";

import {
    USER_LOGIN,
    USER_LOGIN_TOKEN,
    USER_LOGOUT,
    USER_ME,
    USER_REGISTER,
    USER_PROFILE,
    USER_REFRESH,
    USER_LIST,
} from "@/constants/url";

interface UserSession {
    account: string;
    expired_at: string;
    issued_at: string;
    time: string;
    can_renew: boolean;
    email?: string;
    avatar?: string;
    roles?: string[];
    groups?: string[];
}

// 导航菜单项接口
interface NavItem {
    title: string;
    url: string;
    disabled?: boolean;
    icon: LucideIcon; // 使用 LucideIcon 类型
    roles?: string[];
}

// 导航组接口
interface NavGroup {
    title: string;
    url: string;
    items: NavItem[];
}

const adminMainNav: NavGroup[] = [
    {
        title: "userFeature",
        url: "#",
        items: [
            {
                title: "loginHistory",
                url: LOGIN_HISTORY,
                roles: ["su", "admin"],
                icon: LogInIcon,
            },
        ],
    },
    {
        title: "modelFeature",
        url: "#",
        items: [
            {
                title: "user",
                url: `${MODEL}/user`,
                roles: ["su", "admin"],
                icon: UsersIcon,
            },
            {
                title: "config",
                url: `${MODEL}/configuration`,
                roles: ["su", "admin"],
                icon: CogIcon,
            },
        ],
    },
];

const webMainNav: NavGroup[] = [
    {
        title: "userFeature",
        url: "#",
        items: [
            {
                title: "home",
                url: HOME,
                icon: HomeIcon,
            },
        ],
    },
    {
        title: "modelFeature",
        url: "#",
        items: [
            {
                title: "file",
                url: `${MODEL}/file`,
                icon: FileIcon,
            },
            {
                title: "httpDetector",
                url: `${MODEL}/http_detector`,
                icon: LandPlotIcon,
            },
        ],
    },
];

function getMainNav(app: string, roles: string[]) {
    let mainNav = webMainNav;
    switch (app) {
        case "tibbaAdmin":
            mainNav = adminMainNav;
            break;
        case "tibbaWeb":
            mainNav = webMainNav;
            break;
    }
    const result: NavGroup[] = [];
    mainNav.forEach((nav) => {
        const items = nav.items.filter((item) => {
            if (item.roles) {
                return item.roles.some((role) => roles.includes(role));
            }
            return true;
        });
        if (items.length > 0) {
            nav.items = items;
            result.push(nav);
        }
    });
    return result;
}

interface User {
    id: number;
    account: string;
    avatar: string | null;
    created: string;
    email: string | null;
    groups: string[] | null;
    modified: string;
    remark: string | null;
    roles: string[] | null;
    status: number;
}

interface UserState {
    data: UserSession;
    initialized: boolean;
    mainNav: NavGroup[];
    updateMainNav: (app: string, roles: string[]) => Promise<void>;
    resetMainNav: () => void;
    fetch: () => Promise<UserSession>;
    signUp: (account: string, password: string) => Promise<void>;
    login: (
        account: string,
        password: string,
        captcha: string,
    ) => Promise<UserSession>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
    updateProfile: (profile: {
        email?: string;
        avatar?: string;
        roles?: string[];
        groups?: string[];
    }) => Promise<void>;
    list: (params: {
        page: number;
        limit: number;
        keyword?: string;
    }) => Promise<{
        count: number;
        users: User[];
    }>;
}

const defaultUser: UserSession = {
    account: "",
    expired_at: "",
    issued_at: "",
    time: "",
    can_renew: false,
};

const useUserState = create<UserState>((set) => ({
    data: defaultUser,
    initialized: false,
    mainNav: [],
    fetch: async () => {
        const { data: user } = await request.get<UserSession>(USER_ME);
        set({
            initialized: true,
            data: user,
        });
        return user;
    },
    updateMainNav: async (app: string, roles: string[]) => {
        set({
            mainNav: getMainNav(app, roles),
        });
    },
    resetMainNav: () => {
        set({
            mainNav: [],
        });
    },
    signUp: async (account: string, password: string) => {
        await request.post(USER_REGISTER, {
            account,
            password: sha256(password).toString(),
        });
    },
    login: async (account: string, password: string, captcha: string) => {
        const { data } = await request.get<{
            ts: number;
            hash: string;
            token: string;
        }>(USER_LOGIN_TOKEN);
        const msg = `${data.hash}:${sha256(password).toString()}`;
        const { data: user } = await request.post<UserSession>(
            USER_LOGIN,
            {
                ts: data.ts,
                hash: data.hash,
                token: data.token,
                account,
                password: sha256(msg).toString(),
            },
            {
                headers: {
                    "X-Captcha": captcha,
                },
            },
        );
        set({
            initialized: true,
            data: user,
        });
        return user;
    },
    logout: async () => {
        await request.delete(USER_LOGOUT);
        set({
            initialized: true,
            data: defaultUser,
            mainNav: [],
        });
    },
    updateProfile: async (profile: {
        email?: string;
        avatar?: string;
        roles?: string[];
        groups?: string[];
    }) => {
        await request.patch(USER_PROFILE, profile);
    },
    refresh: async () => {
        await request.patch(USER_REFRESH);
    },
    list: async (params: { page: number; limit: number; keyword?: string }) => {
        const { data } = await request.get<{
            count: number;
            users: User[];
        }>(USER_LIST, {
            params,
        });
        return data;
    },
}));

export default useUserState;
