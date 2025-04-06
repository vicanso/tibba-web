// src/components/user-table.tsx
import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchIcon, Loader2Icon } from "lucide-react";
import { formatDate } from "@/helpers/util";

interface User {
    id: number;
    account: string;
    avatar: string | null;
    created: string;
    email: string | null;
    groups: string[] | null;
    modified: string;
    remark: string | null;
    roles: string[] | null;
    status: number;
}

interface UserTableProps {
    data: User[];
    loading?: boolean;
    onSearch?: (query: string) => void;
    onPageChange?: (page: number) => void;
    total?: number;
}

export function UserTable({
    data,
    loading = false,
    onSearch,
    onPageChange,
    total = 0,
}: UserTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const handleSearch = () => {
        onSearch?.(searchQuery);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        onPageChange?.(page);
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1:
                return <Badge variant="default">Active</Badge>;
            case 0:
                return <Badge variant="secondary">Inactive</Badge>;
            default:
                return <Badge variant="destructive">Unknown</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSearch();
                                }
                            }}
                            className="pl-8"
                        />
                    </div>
                </div>
                <Button onClick={handleSearch}>Search</Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead>Groups</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Modified</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2Icon className="mx-auto h-6 w-6 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar || undefined} />
                                                <AvatarFallback>
                                                    {user.account.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{user.account}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles?.map((role) => (
                                                <Badge key={role} variant="outline">
                                                    {role}
                                                </Badge>
                                            )) || "-"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.groups?.map((group) => (
                                                <Badge key={group} variant="secondary">
                                                    {group}
                                                </Badge>
                                            )) || "-"}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                                    <TableCell>
                                        {formatDate(user.created)}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(user.modified)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, total)} of {total} results
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage * pageSize >= total}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}