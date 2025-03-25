import { create } from "zustand";
import request from "@/helpers/request";
import sha256 from "crypto-js/sha256";

import { USER_ME, USER_REGISTER } from "@/constants/url";

interface User {
    account: string;
    expired_at: string;
    issued_at: string;
    time: string;
    can_renew: boolean;
}

interface UserState {
    data: User;
    initialized: boolean;
    fetch: () => Promise<User>;
    register: (account: string, password: string) => Promise<void>;
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
    register: async (account: string, password: string) => {
        await request.post(USER_REGISTER, {
            account,
            password: sha256(password).toString(),
        });
    },
}));

export default useUserState;
