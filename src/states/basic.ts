import { create } from "zustand";
import {
    Users,
} from "lucide-react";
import { USER, LOGIN_HISTORY } from "@/constants/route";
const mainNav = [
    {
        title: "userFeature",
        icon: Users,
        url: "#",
        items: [
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


const useBasicState = create(() => ({
    apps: ["Tibba Web", "Tibba Admin"],
    mainNav,
}));


export default useBasicState;
