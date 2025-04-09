import { useShallow } from "zustand/react/shallow";
import { useSearchParams } from "react-router-dom";
import { useAsync } from "react-async-hook";
import useModelState, { Category, Schema } from "@/states/model";
import { toast } from "sonner";
import { formatDate, formatError } from "@/helpers/util";
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
import { toString, lowerCase } from "lodash-es";
import { useI18n } from "@/i18n";
import bytes from "bytes";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

function getLimitFromStorage(name: string) {
    const limit = localStorage.getItem(`${name}-limit`);
    return limit ? parseInt(limit) : 10;
}

function setLimitToStorage(name: string, limit: number) {
    localStorage.setItem(`${name}-limit`, limit.toString());
}

function formatTableCell(schema: Schema, data: unknown) {
    let value = toString(data);
    let className = "";
    if (schema.fixed) {
        className = "sticky left-0 bg-background z-10";
    }
    switch (schema.category) {
        case Category.Date:
            value = formatDate(value);
            className += " w-[180px]";
            break;
        case Category.Bytes:
            value = bytes(Number(value)) || "";
            className += " w-[100px]";
            break;
        default:
            break;
    }
    return { value, className };
}

export default function Model() {
    const [searchParams, setSearchParams] = useSearchParams();
    const i18nModel = useI18n("model");
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
    const getModelName = () => {
        const name = searchParams.get("name");
        return name || "";
    };
    const getLimit = () => {
        const limit = searchParams.get("limit");
        return limit ? parseInt(limit) : getLimitFromStorage(getModelName());
    };
    const getPage = () => {
        const page = searchParams.get("page");
        return page ? parseInt(page) : 1;
    };

    const updatePage = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        setSearchParams(params);
    };
    const reset = () => {
        const params = new URLSearchParams(searchParams);
        params.delete("page");
        params.delete("limit");
        setSearchParams(params);
        fetch();
    };

    const fetch = async () => {
        try {
            await list({
                page: getPage(),
                limit: getLimit(),
            });
        } catch (error) {
            toast(formatError(error));
        }
    };

    useAsync(async () => {
        if (initialized) {
            return;
        }
        try {
            await fetchSchema(getModelName());
            await fetch();
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
                {lowerCase(schema.name)}
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
                <TableCell
                    colSpan={headers.length}
                    className="h-24 text-center"
                >
                    {i18nModel("noRecords")}
                </TableCell>
            </TableRow>
        );
    } else {
        rows = items.map((item) => {
            const key = `${item.id}`;
            const fields = schemas.map((schema) => {
                const { value, className } = formatTableCell(
                    schema,
                    item[schema.name],
                );
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
    const pageCount = Math.ceil(count / getLimit());

    const renderPagination = () => {
        if (count < 0) {
            return <></>;
        }
        const arr = [];
        const page = getPage();
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pageCount, page + 4);
        if (startPage > 1) {
            arr.push(
                <PaginationItem key="previous">
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            updatePage(getPage() - 1);
                        }}
                    />
                </PaginationItem>,
                <PaginationItem key="ellipsis-start">
                    <PaginationEllipsis />
                </PaginationItem>,
            );
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = page === i;
            arr.push(
                <PaginationItem key={`page-${i}`}>
                    <PaginationLink
                        isActive={isActive}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            updatePage(i);
                        }}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>,
            );
        }
        if (endPage !== pageCount) {
            arr.push(
                <PaginationItem key="ellipsis-end">
                    <PaginationEllipsis />
                </PaginationItem>,
                <PaginationItem key="next">
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            updatePage(getPage() + 1);
                        }}
                    />
                </PaginationItem>,
            );
        }
        return (
            <Pagination className="w-auto">
                <PaginationContent>{arr}</PaginationContent>
            </Pagination>
        );
    };

    return (
        <div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>{headers}</TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length > 0 ? rows : loadingTips}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end mt-4">
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <Select
                        defaultValue={getLimit().toString()}
                        onValueChange={(value) => {
                            setLimitToStorage(getModelName(), parseInt(value));
                            reset();
                        }}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue
                                placeholder={i18nModel("selectRowsPerPage")}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>
                                    {i18nModel("rowsPerPage")}
                                </SelectLabel>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="30">30</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <div className="flex w-[120px] items-center justify-center text-sm font-medium">
                        {i18nModel("pageContent")
                            .replace("{page}", getPage().toString())
                            .replace("{total}", pageCount.toString())}
                    </div>
                    {renderPagination()}
                </div>
            </div>
        </div>
    );
}
