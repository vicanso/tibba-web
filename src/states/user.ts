import { create } from "zustand";
import request from "@/helpers/request";
import sha256 from "crypto-js/sha256";
import { Users, LucideIcon } from "lucide-react";
import { HOME, USER, LOGIN_HISTORY } from "@/constants/route";

import {
    USER_LOGIN,
    USER_LOGIN_TOKEN,
    USER_LOGOUT,
    USER_ME,
    USER_REGISTER,
    USER_PROFILE,
    USER_REFRESH,
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
    roles?: string[];
}

// 导航组接口
interface NavGroup {
    title: string;
    icon: LucideIcon; // 使用 LucideIcon 类型
    url: string;
    items: NavItem[];
}

const defaultMainNav = [
    {
        title: "userFeature",
        icon: Users,
        url: "#",
        items: [
            {
                title: "HOME",
                url: HOME,
                disabled: true,
            },
            {
                title: "user",
                url: USER,
                roles: ["su", "admin"],
                disabled: true,
            },
            {
                title: "loginHistory",
                url: LOGIN_HISTORY,
                roles: ["su", "admin"],
                disabled: true,
            },
        ],
    },
];

interface UserState {
    data: UserSession;
    initialized: boolean;
    mainNav: NavGroup[];
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
    mainNav: defaultMainNav,
    fetch: async () => {
        const { data } = await request.get<UserSession>(USER_ME);
        set({
            initialized: true,
            data,
        });
        return data;
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
        const nav = defaultMainNav.slice(0);
        nav.map((item) => {
            item.items.forEach((item) => {
                if (item.roles) {
                    item.disabled = !item.roles.some((role) =>
                        user.roles?.includes(role),
                    );
                } else {
                    item.disabled = false;
                }
            });
        });
        set({
            initialized: true,
            data: user,
            mainNav: nav,
        });
        return user;
    },
    logout: async () => {
        await request.delete(USER_LOGOUT);
        set({
            initialized: true,
            data: defaultUser,
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
}));

export default useUserState;
