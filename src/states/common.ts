import { create } from "zustand";
import request from "@/helpers/request";
import { COMMON_CAPTCHA } from "@/constants/url";

interface Captcha {
    id: string;
    data: string;
}

interface CommonState {
    fetchCaptcha: () => Promise<Captcha>;
}

const useCommonState = create<CommonState>(() => ({
    fetchCaptcha: async () => {
        const { data } = await request.get<Captcha>(COMMON_CAPTCHA);
        return data;
    },
}));

export default useCommonState;
