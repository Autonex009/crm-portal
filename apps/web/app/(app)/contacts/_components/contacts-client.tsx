"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, initials } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContactSheet } from "./contact-sheet";
import { deleteContact } from "@/lib/actions/contacts";
import { toast } from "@/components/ui/use-toast";
import { Users, MoreHorizontal, Pencil, Trash2, Search, Mail, Phone } from "lucide-react";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  company_id: string;
  company_name: string | null;
}

interface Company {
  id: string;
  name: string;
}

export function ContactsClient({ contacts, companies }: { contacts: Contact[]; companies: Company[] }) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company_name?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q)
    );
  });

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteContact(id);
      if (result.success) {
        toast({ title: "Contact deleted", variant: "success" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <ContactSheet companies={companies} />
      </div>

      <div className="rounded-lg border bg-card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title={search ? "No results found" : "No contacts yet"}
            description={search ? `No contacts match "${search}"` : "Add your first contact to get started"}
            action={!search ? <ContactSheet companies={companies} /> : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {initials(`${contact.first_name} ${contact.last_name}`)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{contact.first_name} {contact.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.company_name ? (
                      <Link href={`/companies/${contact.company_id}`} className="text-sm text-primary hover:underline">
                        {contact.company_name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.title ? (
                      <Badge variant="secondary" className="font-normal">{contact.title}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-sm">
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {contact.email}
                      </a>
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <ContactSheet
                          contact={contact}
                          companies={companies}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(contact.id, `${contact.first_name} ${contact.last_name}`)}
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
      <p className="text-xs text-muted-foreground">{filtered.length} of {contacts.length} contacts</p>
    </div>
  );
}
