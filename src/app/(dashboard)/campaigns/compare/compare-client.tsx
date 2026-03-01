"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CompareClient({ campaigns }: { campaigns: any[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }

  const compared = campaigns.filter((c) => selected.includes(c.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/campaigns"><Button variant="outline" size="sm">&larr; Back</Button></Link>
        <p className="text-sm text-muted-foreground">Select campaigns to compare ({selected.length} selected)</p>
      </div>

      {/* Selection table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead className="text-right">Recipients</TableHead>
              <TableHead className="text-right">Open Rate</TableHead>
              <TableHead className="text-right">Click Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => toggle(c.id)}>
                <TableCell>
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="rounded" />
                </TableCell>
                <TableCell className="font-medium">{c.subject}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="text-right">{c.total_recipients}</TableCell>
                <TableCell className="text-right">{c.openRate}%</TableCell>
                <TableCell className="text-right">{c.clickRate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Comparison cards */}
      {compared.length >= 2 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Comparison</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(compared.length, 4)}, 1fr)` }}>
            {compared.map((c) => {
              const stats = c.campaign_stats?.[0];
              return (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium leading-tight">{c.subject}</CardTitle>
                    <p className="text-xs text-muted-foreground">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : ""}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recipients</span>
                      <span className="font-medium">{c.total_recipients}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Open Rate</span>
                      <Badge variant={parseFloat(c.openRate) > 20 ? "default" : "secondary"}>{c.openRate}%</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Click Rate</span>
                      <Badge variant={parseFloat(c.clickRate) > 2 ? "default" : "secondary"}>{c.clickRate}%</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bounces</span>
                      <span>{stats?.bounced ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Complaints</span>
                      <span>{stats?.complained ?? 0}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {campaigns.length === 0 && (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">No sent campaigns to compare.</div>
      )}
    </div>
  );
}
