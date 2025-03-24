import { createHashRouter } from "react-router-dom";
import Root from "@/pages/Root";
import Home from "@/pages/Home";
import User from "@/pages/User";
import LoginHistory from "@/pages/LoginHistory";

import {
    USER,
    LOGIN_HISTORY,
    HOME,
} from "@/constants/route";


const router = createHashRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                path: HOME,
                element: <Home />,
            },
            {
                path: USER,
                element: <User />,
            },
            {
                path: LOGIN_HISTORY,
                element: <LoginHistory />,
            },
        ],
    },
]);

export default router;
