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
import { Loader2Icon, ChevronDownIcon, Columns2Icon, SearchIcon, ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toString, upperFirst } from "lodash-es";
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
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getModelViewOptions, setModelViewOptions } from "@/storage";


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

function formatFieldName(name: string) {
    return name.split("_").map(upperFirst).join(" ");
}

export default function Model() {
    const i18nModel = useI18n("model");
    const [searchParams, setSearchParams] = useSearchParams();
    let modelViewOptions = getModelViewOptions(searchParams.get("name") || "");
    const [hiddenColumns, setHiddenColumns] = useState<string[]>(modelViewOptions.hiddenColumns);
    const [keyword, setKeyword] = useState("");
    const [
        initialized,
        model,
        schemaView,
        fetchSchema,
        list,
        items,
        count,
        reset,
    ] = useModelState(
        useShallow((state) => [
            state.initialized,
            state.model,
            state.schemaView,
            state.fetchSchema,
            state.list,
            state.items,
            state.count,
            state.reset,
        ]),
    );


    const [filters, setFilters] = useState<Record<string, string>>({});
    const getQueryOptions = (params: URLSearchParams) => {
        const page = params.get("page");
        const limit = params.get("limit");
        const name = params.get("name") || "";
        const sort = params.get("sort") || "-modified";
        return {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : modelViewOptions.limit,
            name,
            sort,
        };
    };

    const updatePage = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        setSearchParams(params);
    };
    const updateLimit = (limit: number) => {
        const name = getQueryOptions(searchParams).name;
        modelViewOptions.limit = limit;
        setModelViewOptions(name, modelViewOptions);

        const params = new URLSearchParams(searchParams);
        params.delete("page");
        params.set("limit", limit.toString());
        setSearchParams(params);
    };
    const updateHiddenColumns = (column: string, checked: boolean) => {
        const name = getQueryOptions(searchParams).name;
        const hiddenColumns = modelViewOptions.hiddenColumns;
        const index = hiddenColumns.indexOf(column);
        if (!checked) {
            if (index === -1) {
                hiddenColumns.push(column);
            }
        } else {
            hiddenColumns.splice(index, 1);
        }
        modelViewOptions.hiddenColumns = hiddenColumns;
        setModelViewOptions(name, modelViewOptions);
        setHiddenColumns(hiddenColumns);
    }
    const updateSort = (sortField: string) => {
        const { sort } = getQueryOptions(searchParams);
        const params = new URLSearchParams(searchParams);
        if (sort === `-${sortField}`) {
            params.set("sort", sortField);
        } else if (sort === sortField) {
            params.delete("sort");
        } else {
            params.set("sort", `-${sortField}`);
        }
        setSearchParams(params);
    }
    const triggerSearch = () => {
        const params = new URLSearchParams(searchParams);
        // trigger search params update
        if (params.get("page")) {
            params.delete("page");
        } else {
            params.set("page", "1");
        }
        setSearchParams(params);
    };
    const handleFilter = () => {
        reset();
        triggerSearch();
    };

    useAsync(async () => {
        try {
            const {
                page,
                limit,
                name,
                sort,
            } = getQueryOptions(searchParams);
            if (name && name !== model) {
                await fetchSchema(name);
                modelViewOptions = getModelViewOptions(name);
            }
            await list({
                page,
                limit,
                keyword,
                filters,
                order_by: sort,
            });
        } catch (error) {
            toast(formatError(error));
        }
    }, [searchParams]);
    if (!initialized) {
        return <Loading />;
    }

    const schemas = schemaView.schemas.filter((schema) => !schema.hidden && !hiddenColumns.includes(schema.name));
    const headers = schemas.map((schema) => {
        let className = "";
        if (schema.fixed) {
            className = "sticky left-0 bg-background z-10";
        }
        const supportSort = schemaView.sort_fields.includes(schema.name);
        let text = <span className="text-muted-foreground">
            {formatFieldName(schema.name)}
        </span>;
        if (supportSort) {
            let icon = <ArrowUpDownIcon />;
            const { sort } = getQueryOptions(searchParams);
            if (sort === `-${schema.name}`) {
                icon = <ArrowDownIcon />;
            } else if (sort === schema.name) {
                icon = <ArrowUpIcon />;
            }
            text = <Button variant="ghost" className="flex items-center gap-1 cursor-pointer text-muted-foreground" onClick={() => {
                updateSort(schema.name);
            }}>
                {formatFieldName(schema.name)}
                {icon}
            </Button>
        }

        return (
            <TableHead className={cn("h-14", className)} key={schema.name}>
                {text}
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
    const pageCount = Math.ceil(count / getQueryOptions(searchParams).limit);

    const renderPagination = () => {
        if (count < 0) {
            return <></>;
        }
        const arr = [];
        const page = getQueryOptions(searchParams).page;
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pageCount, page + 4);
        if (startPage > 1) {
            arr.push(
                <PaginationItem key="previous">
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            updatePage(page - 1);
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
                            updatePage(page + 1);
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
    const columnFilter = schemaView.schemas
        .filter((schema) => !schema.hidden)
        .map((schema) => {
            return (
                <DropdownMenuCheckboxItem
                    key={schema.name}
                    // className="capitalize"
                    checked={!hiddenColumns.includes(schema.name)}
                    onCheckedChange={(checked) => {
                        updateHiddenColumns(schema.name, checked);
                    }}
                >
                    {formatFieldName(schema.name)}
                </DropdownMenuCheckboxItem>
            );
        });
    const conditions = schemaView.conditions.map((condition) => {
        const { category, options, name } = condition;
        // condition category: input select
        console.dir(category);
        const items = options.map((option) => {
            return (
                <SelectItem
                    key={`${name}-${option.value}`}
                    value={option.value}
                >
                    {option.label}
                </SelectItem>
            );
        });
        return (
            <Select
                key={name}
                onValueChange={(value) => {
                    if (value === "none") {
                        delete filters[name];
                    } else {
                        filters[name] = value;
                    }
                    setFilters(filters);
                    // setLimitToStorage(queryOptions.name, parseInt(value));
                    // updateLimit(parseInt(value));
                }}
            >
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={`${i18nModel("select")} ${name}`} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem key={`${name}-default`} value={"none"}>
                            None
                        </SelectItem>
                        {items}
                    </SelectGroup>
                </SelectContent>
            </Select>
        );
    });
    return (
        <div>
            <div className="flex justify-between gap-2 mb-4">
                <Input
                    placeholder={i18nModel("keywordPlaceholder")}
                    onKeyDownCapture={(e) => {
                        if (e.key === "Enter") {
                            triggerSearch();
                        }
                    }}
                    onChange={(e) => {
                        setKeyword(e.target.value.trim());
                    }}
                />
                {conditions}
                <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                        handleFilter();
                    }}
                >
                    <SearchIcon />
                    {i18nModel("filter")}
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Columns2Icon />
                            <span className="hidden lg:inline">
                                Customize Columns
                            </span>
                            <span className="lg:hidden">Columns</span>
                            <ChevronDownIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        {columnFilter}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
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
                        defaultValue={getQueryOptions(searchParams).limit.toString()}
                        onValueChange={(value) => {
                            updateLimit(parseInt(value));
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
                            .replace("{page}", getQueryOptions(searchParams).page.toString())
                            .replace("{total}", pageCount.toString())}
                    </div>
                    {renderPagination()}
                </div>
            </div>
        </div>
    );
}
