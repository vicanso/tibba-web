import { createHashRouter } from "react-router-dom";
import Root from "@/pages/Root";
import Home from "@/pages/Home";
import User from "@/pages/User";
import LoginHistory from "@/pages/LoginHistory";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";

import { USER, LOGIN_HISTORY, HOME, LOGIN, SIGN_UP } from "@/constants/route";

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
            {
                path: LOGIN,
                element: <Login />,
            },
            {
                path: SIGN_UP,
                element: <SignUp />,
            },
        ],
    },
]);

export default router;
