import { createHashRouter } from "react-router";
import Root from "@/pages/Root";
import Home from "@/pages/Home";
import LoginHistory from "@/pages/LoginHistory";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import Profile from "@/pages/Profile";
import Model from "@/pages/Model";

import {
    LOGIN_HISTORY,
    HOME,
    LOGIN,
    SIGN_UP,
    PROFILE,
    MODEL,
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
                path: LOGIN_HISTORY,
                element: <LoginHistory />,
            },
            {
                path: LOGIN,
                element: <Login />,
            },
            {
                path: SIGN_UP,
                element: <SignUp />,
            },
            {
                path: PROFILE,
                element: <Profile />,
            },
            {
                path: `${MODEL}/:name`,
                element: <Model />,
            },
        ],
    },
]);

export default router;
