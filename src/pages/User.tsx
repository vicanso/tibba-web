import useBasicState from "@/states/basic";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useState } from "react";
import { UserTable } from "@/components/user-table";
import useUserState from "@/states/user";

export default function User() {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [setPageHeaderNavigation, resetPageHeaderNavigation] = useBasicState(
        useShallow((state) => [
            state.setPageHeaderNavigation,
            state.resetPageHeaderNavigation,
        ]),
    );
    const [listUser] = useUserState(useShallow((state) => [state.list]));
    const handleSearch = async (query: string) => {
        setLoading(true);
        try {
            // 实现搜索逻辑
            const { users, count } = await listUser({
                page: 1,
                limit: 10,
                keyword: query,
            });
            setUsers(users);
            setTotal(count);
        } catch (error) {
            console.error("Failed to search users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = async (page: number) => {
        setLoading(true);
        try {
            // 实现分页逻辑
            const response = await fetch(`/api/users?page=${page}`);
            const data = await response.json();
            setUsers(data.users);
            setTotal(data.total);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        setPageHeaderNavigation([
            {
                title: "UserA",
                url: "/",
            },
            {
                title: "UserB",
                url: "/login",
            },
        ]);
        return () => {
            resetPageHeaderNavigation();
        };
    });
    return (
        <div className="container mx-auto p-4">
            <h1 className="mb-4 text-2xl font-bold">Users</h1>
            <UserTable
                data={users}
                loading={loading}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                total={total}
            />
        </div>
    );
}
