import { createHashRouter } from "react-router-dom";

import Root from "@/pages/Root";
import Home from "@/pages/Home";

const router = createHashRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                path: "/",
                element: <Home />,
            },
        ],
    },
]);

export default router;
