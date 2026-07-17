"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanySheet } from "./company-sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteCompany, archiveCompany, restoreCompany, hardDeleteCompany } from "@/lib/actions/companies";
import { toast } from "@/components/ui/use-toast";
import { Building2, MoreHorizontal, Pencil, Trash2, ExternalLink, Search, Archive, RotateCcw } from "lucide-react";
import { formatDate, initials } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  owner_id: string;
  created_at: string;
}

export function CompaniesTable({
  companies,
  archivedCompanies,
}: {
  companies: Company[];
  archivedCompanies: Company[];
}) {
  const [search, setSearch] = useState("");
  const [archiveSearch, setArchiveSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<
    | { type: "delete"; id: string; name: string }
    | { type: "archive"; id: string; name: string }
    | { type: "hardDelete"; id: string; name: string }
    | null
  >(null);

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.domain?.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredArchived = archivedCompanies.filter(
    (c) =>
      c.name.toLowerCase().includes(archiveSearch.toLowerCase()) ||
      c.domain?.toLowerCase().includes(archiveSearch.toLowerCase()) ||
      c.industry?.toLowerCase().includes(archiveSearch.toLowerCase())
  );

  function handleDelete(id: string, name: string) {
    setConfirmAction({ type: "delete", id, name });
  }

  function handleArchive(id: string, name: string) {
    setConfirmAction({ type: "archive", id, name });
  }

  function handleRestore(id: string) {
    startTransition(async () => {
      const result = await restoreCompany(id);
      if (result.success) {
        toast({ title: "Company restored", variant: "success" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  function handleHardDelete(id: string, name: string) {
    setConfirmAction({ type: "hardDelete", id, name });
  }

  function executeConfirmedAction() {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    startTransition(async () => {
      const result =
        type === "delete"
          ? await deleteCompany(id)
          : type === "archive"
          ? await archiveCompany(id)
          : await hardDeleteCompany(id);

      if (result.success) {
        toast({
          title:
            type === "delete"
              ? "Company deleted"
              : type === "archive"
              ? "Company moved to archive"
              : "Company permanently deleted",
          variant: "success",
        });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
      setConfirmAction(null);
    });
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="active" className="space-y-4">
        <div className="flex items-center justify-between border-b pb-1">
          <TabsList>
            <TabsTrigger value="active">Active Companies</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active" className="space-y-4 mt-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <CompanySheet />
          </div>

          <div className="rounded-lg border bg-card">
            {filtered.length === 0 ? (
              search ? (
                <EmptyState
                  icon={<Search className="h-8 w-8" />}
                  title="No results found"
                  description={`No companies match "${search}"`}
                />
              ) : (
                <EmptyState
                  icon={<Building2 className="h-8 w-8" />}
                  title="No companies yet"
                  description="Add your first company to get started"
                  action={<CompanySheet />}
                />
              )
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <Link
                          href={`/companies/${company.id}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                              {initials(company.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{company.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {company.industry ? (
                          <Badge variant="secondary" className="font-normal">{company.industry}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.domain ? (
                          <a
                            href={`https://${company.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            {company.domain}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(company.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/companies/${company.id}`}>
                                <ExternalLink className="h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <CompanySheet
                              company={company}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              }
                            />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleArchive(company.id, company.name)}
                            >
                              <Archive className="h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(company.id, company.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {companies.length} companies
          </p>
        </TabsContent>

        <TabsContent value="archive" className="space-y-4 mt-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search archived companies..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-card">
            {filteredArchived.length === 0 ? (
              <EmptyState
                icon={<Archive className="h-8 w-8" />}
                title={archiveSearch ? "No results found" : "Archive is empty"}
                description={archiveSearch ? `No archived companies match "${archiveSearch}"` : "Companies you archive or delete will appear here"}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArchived.map((company) => (
                    <TableRow key={company.id} className="opacity-75">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                              {initials(company.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-muted-foreground">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.industry ? (
                          <Badge variant="secondary" className="font-normal text-muted-foreground">{company.industry}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.domain ? (
                          <span className="text-sm text-muted-foreground">{company.domain}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(company.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleRestore(company.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                              Restore
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleHardDelete(company.id, company.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredArchived.length} of {archivedCompanies.length} archived companies
          </p>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        description={
          confirmAction?.type === "archive"
            ? `This will move "${confirmAction.name}" to the archive.`
            : confirmAction?.type === "hardDelete"
            ? `This will permanently delete "${confirmAction.name}". This cannot be undone.`
            : confirmAction
            ? `This will delete "${confirmAction.name}".`
            : undefined
        }
        destructive={confirmAction?.type !== "archive"}
        loading={isPending}
        onConfirm={executeConfirmedAction}
      />
    </div>
  );
}

