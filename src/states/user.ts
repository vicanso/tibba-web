import { create } from "zustand";
import request from "@/helpers/request";
import sha256 from "crypto-js/sha256";

import {
    USER_LOGIN,
    USER_LOGIN_TOKEN,
    USER_LOGOUT,
    USER_ME,
    USER_REGISTER,
    USER_PROFILE,
    USER_REFRESH,
} from "@/constants/url";

interface User {
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

interface UserState {
    data: User;
    initialized: boolean;
    fetch: () => Promise<User>;
    signUp: (account: string, password: string) => Promise<void>;
    login: (
        account: string,
        password: string,
        captcha: string,
    ) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
    updateProfile: (profile: {
        email?: string;
        avatar?: string;
        roles?: string[];
        groups?: string[];
    }) => Promise<void>;
}

const defaultUser: User = {
    account: "",
    expired_at: "",
    issued_at: "",
    time: "",
    can_renew: false,
};

const useUserState = create<UserState>((set) => ({
    data: defaultUser,
    initialized: false,
    fetch: async () => {
        const { data } = await request.get<User>(USER_ME);
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
        const { data: user } = await request.post<User>(
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
