import { useShallow } from "zustand/react/shallow";
import { useSearchParams } from "react-router-dom";
import { useAsync } from "react-async-hook";
import useModelState from "@/states/model";
import { useState } from "react";
import { toast } from "sonner";
import { formatError } from "@/helpers/util";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loading } from "@/components/loading";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Model() {
    const [searchParams] = useSearchParams();
    const [initialized, schemaView, fetchSchema, list, items, count] =
        useModelState(
            useShallow((state) => [
                state.initialized,
                state.schemaView,
                state.fetchSchema,
                state.list,
                state.items,
                state.count,
            ]),
        );
    useAsync(async () => {
        const name = searchParams.get("name");
        try {
            await fetchSchema(name || "");
            await list({
                page: 1,
                limit: 10,
            });
        } catch (error) {
            toast(formatError(error));
        }
    }, [searchParams]);
    if (!initialized) {
        return <Loading />;
    }
    const schemas = schemaView.schemas.filter((schema) => !schema.hidden);
    const headers = schemas.map((schema) => {
        let className = "";
        if (schema.fixed) {
            className = "sticky left-0 bg-background z-10";
        }
        return (
            <TableHead className={cn("h-14", className)} key={schema.name}>
                {schema.name}
            </TableHead>
        );
    });

    let loadingTips = <></>;
    let rows: React.ReactNode[] = [];
    if (count === -1) {
        loadingTips = (
            <TableRow>
                <TableCell
                    colSpan={headers.length}
                    className="h-24 text-center"
                >
                    <Loader2Icon className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
            </TableRow>
        );
    } else if (count === 0) {
        loadingTips = (
            <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                    No users found.
                </TableCell>
            </TableRow>
        );
    } else {
        rows = items.map((item) => {
            const key = `${item.id}`;

            const fields = schemas.map((schema) => {
                const v = item[schema.name];
                let value = "";
                if (v !== null) {
                    value = `${v}`;
                }
                let className = "";
                if (schema.fixed) {
                    className = "sticky left-0 bg-background z-10";
                }
                return (
                    <TableCell
                        className={cn("h-16", className)}
                        key={`${key}-${schema.name} `}
                    >
                        {value}
                    </TableCell>
                );
            });

            return <TableRow key={`${item.id} `}>{fields}</TableRow>;
        });
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>{headers}</TableRow>
                </TableHeader>
                <TableBody>{rows.length > 0 ? rows : loadingTips}</TableBody>
            </Table>
        </div>
    );
}
