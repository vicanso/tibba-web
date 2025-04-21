import { useShallow } from "zustand/react/shallow";
import { useSearchParams, useParams } from "react-router";
import { useAsync } from "react-async-hook";
import useModelState, {
    Category,
    ConditionCategory,
    Schema,
} from "@/states/model";
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
import {
    Loader2Icon,
    Columns2Icon,
    SearchIcon,
    ArrowDownIcon,
    ArrowUpIcon,
    ArrowUpDownIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    EllipsisIcon,
    EyeIcon,
    FilePenLineIcon,
    TrashIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toArray, toString, upperFirst } from "lodash-es";
import { useI18n } from "@/i18n";
import bytes from "bytes";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
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
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getModelViewOptions, setModelViewOptions } from "@/storage";
import { Badge } from "@/components/ui/badge";
import { MODEL_EDITOR } from "@/constants/route";
import { goTo } from "@/routers";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/model-components";
import useUserState from "@/states/user";

function formatTableCell(
    i18nModel: (value: string) => string,
    schema: Schema,
    data: unknown,
) {
    let value = toString(data);
    let className = "";
    if (schema.fixed) {
        className = "sticky left-0 bg-background z-10";
    }
    let element = <span>{value}</span>;
    switch (schema.category) {
        case Category.Date:
            value = formatDate(value);
            className += " w-[180px]";
            element = <span>{value}</span>;
            break;
        case Category.Bytes:
            value = bytes(Number(value)) || "";
            className += " w-[100px]";
            element = <span>{value}</span>;
            break;
        case Category.Status:
            element = (
                <StatusBadge status={value as string} i18nModel={i18nModel} />
            );
            className += " w-[100px]";
            break;
        case Category.Json: {
            let isJson = false;
            try {
                const json = JSON.parse(value as string);
                value = JSON.stringify(json, null, 2);
                isJson = true;
            } catch (error) {
                console.error(error);
            }
            if (isJson) {
                element = <pre>{value}</pre>;
            }
            break;
        }
        case Category.Strings:
            {
                const arr = toArray(data).map((item) => {
                    return (
                        <Badge key={item} variant="outline">
                            {item}
                        </Badge>
                    );
                });
                element = <div className="flex flex-wrap gap-2">{arr}</div>;
            }
            break;
        default:
            break;
    }
    return { element, className };
}

function formatFieldName(name: string) {
    return name.split("_").map(upperFirst).join(" ");
}

export default function Model() {
    const i18nModel = useI18n("model");
    const [searchParams, setSearchParams] = useSearchParams();
    const [targetId, setTargetId] = useState<number | null>(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const modelName = useParams().name || "";
    let modelViewOptions = getModelViewOptions(modelName);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>(
        modelViewOptions.hiddenColumns,
    );
    const [keyword, setKeyword] = useState("");
    const [userInfo] = useUserState(useShallow((state) => [state.data]));
    const [
        initialized,
        model,
        schemaView,
        fetchSchema,
        modelList,
        modelItems,
        modelCount,
        modelReset,
        removeModel,
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
            state.remove,
        ]),
    );

    // console.dir(schemaView.allow_create);

    const [filters, setFilters] = useState<Record<string, string>>({});
    const getQueryOptions = (params: URLSearchParams) => {
        const page = params.get("page");
        const limit = params.get("limit");
        const sort = params.get("sort") || "-modified";
        return {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : modelViewOptions.limit,
            sort,
        };
    };
    const getIdentity = (id: number | null) => {
        if (!id) {
            return "";
        }
        const item = modelItems.find((item) => item.id === id);
        if (!item) {
            return "";
        }
        const identityArr: string[] = [];

        schemaView.schemas.forEach((schema) => {
            if (schema.identity) {
                identityArr.push(toString(item[schema.name]));
            }
        });
        return identityArr.join("-");
    };

    const updatePage = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        setSearchParams(params);
    };
    const updateLimit = (limit: number) => {
        modelViewOptions.limit = limit;
        setModelViewOptions(modelName, modelViewOptions);

        const params = new URLSearchParams(searchParams);
        params.delete("page");
        params.set("limit", limit.toString());
        setSearchParams(params);
    };
    const updateHiddenColumns = (column: string, checked: boolean) => {
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
        setModelViewOptions(modelName, modelViewOptions);
        setHiddenColumns(hiddenColumns);
    };
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
    };
    const goToView = (id: number) => {
        goTo(`${MODEL_EDITOR}/${modelName}/${id}`);
    };
    const goToEdit = (id: number) => {
        goTo(`${MODEL_EDITOR}/${modelName}/${id}?type=edit`);
    };
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
        modelReset();
        triggerSearch();
    };

    const resetFilterConditions = () => {
        setKeyword("");
        setFilters({});
    };
    const handleDelete = () => {
        if (targetId) {
            removeModel({
                id: targetId,
                model: modelName,
            });
        }
    };

    const allowCreate = () => {
        if (!userInfo.account || !schemaView.allow_create) {
            return false;
        }
        const { roles, groups } = schemaView.allow_create;
        if (roles.includes("*")) {
            return true;
        }
        if (roles.some((role) => userInfo.roles?.includes(role))) {
            return true;
        }
        if (groups.some((group) => userInfo.groups?.includes(group))) {
            return true;
        }

        return false;
    };

    useAsync(async () => {
        try {
            const { page, limit, sort } = getQueryOptions(searchParams);
            const listParams = {
                page,
                limit,
                keyword,
                filters,
                order_by: sort,
            };
            if (modelName && modelName !== model) {
                resetFilterConditions();
                listParams.keyword = "";
                listParams.filters = {};
                modelReset();
                await fetchSchema(modelName);
                modelViewOptions = getModelViewOptions(modelName);
                setHiddenColumns(modelViewOptions.hiddenColumns);
            }
            await modelList(listParams);
        } catch (error) {
            toast(formatError(error));
        }
    }, [searchParams, modelName]);
    if (!initialized) {
        return <Loading />;
    }

    const schemas = schemaView.schemas.filter(
        (schema) => !schema.hidden && !hiddenColumns.includes(schema.name),
    );
    const headers = schemas.map((schema) => {
        let className = "";
        if (schema.fixed) {
            className = "sticky left-0 bg-background z-10";
        }
        const supportSort = schemaView.sort_fields.includes(schema.name);
        let text = (
            <span className="text-muted-foreground">
                {formatFieldName(schema.name)}
            </span>
        );
        if (supportSort) {
            let icon = <ArrowUpDownIcon />;
            const { sort } = getQueryOptions(searchParams);
            if (sort === `-${schema.name}`) {
                icon = <ArrowDownIcon />;
            } else if (sort === schema.name) {
                icon = <ArrowUpIcon />;
            }
            text = (
                <Button
                    variant="ghost"
                    className="flex items-center gap-1 cursor-pointer text-muted-foreground"
                    onClick={() => {
                        updateSort(schema.name);
                    }}
                >
                    {formatFieldName(schema.name)}
                    {icon}
                </Button>
            );
        }

        return (
            <TableHead className={cn("h-12", className)} key={schema.name}>
                {text}
            </TableHead>
        );
    });

    const actionClass = "w-24";

    headers.push(
        <TableHead
            className={cn("h-12", actionClass)}
            key="actions-header"
        ></TableHead>,
    );

    let loadingTips = <></>;
    let rows: React.ReactNode[] = [];
    if (modelCount === -1) {
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
    } else if (modelCount === 0) {
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
        rows = modelItems.map((item) => {
            const id = item.id as number;
            const key = `${id}`;
            const fields = schemas.map((schema) => {
                const { element, className } = formatTableCell(
                    i18nModel,
                    schema,
                    item[schema.name],
                );
                return (
                    <TableCell
                        className={cn("h-14", className)}
                        key={`${key}-${schema.name} `}
                    >
                        {element}
                    </TableCell>
                );
            });
            fields.push(
                <TableCell
                    key="actions-cell"
                    className={cn("h-14", actionClass)}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => goToView(id)}
                    >
                        <EyeIcon />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <EllipsisIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-48"
                            align="start"
                            side="left"
                        >
                            <DropdownMenuItem
                                className="flex justify-between gap-2 cursor-pointer"
                                onClick={() => {
                                    goToEdit(id);
                                }}
                            >
                                {i18nModel("edit")}
                                <FilePenLineIcon />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="flex justify-between gap-2 cursor-pointer"
                                onClick={() => {
                                    setTargetId(id);
                                    setOpenDeleteDialog(true);
                                }}
                            >
                                {i18nModel("delete")}
                                <TrashIcon />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>,
            );

            return <TableRow key={`${item.id} `}>{fields}</TableRow>;
        });
    }
    const pageCount = Math.ceil(
        modelCount / getQueryOptions(searchParams).limit,
    );

    const renderPagination = () => {
        if (modelCount < 0) {
            return <></>;
        }
        const arr = [];
        const page = getQueryOptions(searchParams).page;
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pageCount, page + 4);
        if (startPage > 1) {
            arr.push(
                <PaginationItem key="previous">
                    <PaginationLink
                        aria-label="Go to previous page"
                        size="default"
                        className="gap-1 px-2.5 sm:pl-2.5"
                        onClick={(e) => {
                            e.preventDefault();
                            updatePage(page - 1);
                        }}
                        href="#"
                    >
                        <ChevronLeftIcon />
                        <span className="hidden sm:block">
                            {i18nModel("previousPage")}
                        </span>
                    </PaginationLink>
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
        if (page < pageCount) {
            arr.push(
                <PaginationItem key="ellipsis-end">
                    <PaginationEllipsis />
                </PaginationItem>,
                <PaginationItem key="next">
                    <PaginationLink
                        aria-label="Go to next page"
                        size="default"
                        className="gap-1 px-2.5 sm:pr-2.5"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            updatePage(page + 1);
                        }}
                    >
                        <span className="hidden sm:block">
                            {i18nModel("nextPage")}
                        </span>
                        <ChevronRightIcon />
                    </PaginationLink>
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
        if (category === ConditionCategory.Input) {
            return (
                <Input
                    className="w-[200px]"
                    key={name}
                    placeholder={`${i18nModel("input")} ${name}`}
                    onChange={(e) => {
                        filters[name] = e.target.value.trim();
                        setFilters(filters);
                    }}
                />
            );
        }
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
                }}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue
                        placeholder={`${i18nModel("select")} ${name}`}
                    />
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

    let tableBtnLayerClass = "justify-end";
    if (allowCreate()) {
        tableBtnLayerClass = "justify-between";
    }

    return (
        <div>
            <AlertDialog
                open={openDeleteDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        setOpenDeleteDialog(false);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {i18nModel("deleteTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {i18nModel("deleteDescription")}
                        </AlertDialogDescription>
                        <AlertDialogDescription>
                            Schema:{" "}
                            <span className="font-bold">{modelName}</span>{" "}
                            <br />
                            Id:{" "}
                            <span className="font-bold">
                                {getIdentity(targetId)}
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">
                            {i18nModel("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="cursor-pointer"
                            onClick={handleDelete}
                        >
                            {i18nModel("continue")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2 mb-4">
                <Input
                    className="w-[200px]"
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
                <div className="flex-grow"></div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Columns2Icon />
                            <span>{i18nModel("columns")}</span>
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
            <div className={cn("flex items-center mt-4", tableBtnLayerClass)}>
                {allowCreate() && (
                    <Button
                        variant="outline"
                        onClick={() => {
                            goToEdit(0);
                        }}
                    >
                        {i18nModel("create")}
                    </Button>
                )}
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <Select
                        defaultValue={getQueryOptions(
                            searchParams,
                        ).limit.toString()}
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
                            .replace(
                                "{page}",
                                getQueryOptions(searchParams).page.toString(),
                            )
                            .replace("{total}", pageCount.toString())}
                    </div>
                    {renderPagination()}
                </div>
            </div>
        </div>
    );
}
