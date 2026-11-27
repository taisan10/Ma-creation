"use client";

import { useState } from "react";
import {
  Palette,
  Users,
  CreditCard,
  TrendingUp,
  Download,
  MessageSquare,
  Eye,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminThemePage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* 1. Header & Architecture Philosophy */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Design System & Theme Spec</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            The frozen visual constitution for MA Creation Admin Console. Strictly enforces the 90-8-2 rule (Zero Atrangi Colors).
          </p>
        </div>

        <Badge variant="outline" className="px-3 py-1 text-xs self-start sm:self-auto font-mono">
          STATUS: FROZEN
        </Badge>
      </div>

      {/* 2. The 90-8-2 Rule Explainer */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">90% Neutral Canvas</CardTitle>
            <CardDescription className="text-xs">Backgrounds, Cards, Borders, Typography</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Zinc / Slate OKLCH tokens. Pure black, crisp white, hairline borders, and neutral grays. Gives an executive, calm, focused environment.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">8% Primary Accent</CardTitle>
            <CardDescription className="text-xs">Active States, Selected Tabs, Key CTAs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              High-contrast single tone (Graphite in light, pure off-white in dark). Guides the eye directly to the current focus without visual competition.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">2% Semantic Signals</CardTitle>
            <CardDescription className="text-xs">Restrained Micro-Dots & Critical Alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Colors never fill entire badges or cards. Status is conveyed via clean 6px micro-dots or system red for destructive actions only.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Standardized Badges & Micro-Dot Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">1. Standardized Badges (The Micro-Dot System)</CardTitle>
          <CardDescription className="text-xs">
            Replaces flashy rainbow yellow/blue/green fills with refined, monochromatic badges featuring subtle status micro-dots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Paid User */}
            <Badge variant="outline" className="gap-1.5 text-xs font-normal">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Paid User
            </Badge>

            {/* Registered User */}
            <Badge variant="outline" className="gap-1.5 text-xs font-normal text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              Registered User
            </Badge>

            {/* Playback Locked / Danger */}
            <Badge variant="outline" className="gap-1.5 text-xs font-normal text-destructive border-destructive/30">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              Playback Locked
            </Badge>

            {/* Warning / Pending */}
            <Badge variant="outline" className="gap-1.5 text-xs font-normal">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Pending Review
            </Badge>

            {/* Admin Account */}
            <Badge variant="secondary" className="text-xs font-medium">
              System Admin
            </Badge>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
            <strong>Rule:</strong> Badges must never use high-saturation backgrounds like <code className="text-foreground">bg-amber-100</code> or <code className="text-foreground">bg-red-100</code>. Always use <code className="text-foreground">variant=&quot;outline&quot;</code> with a 2-pixel micro-dot indicator.
          </div>
        </CardContent>
      </Card>

      {/* 4. Filter Tabs Standard (Zero-Emoji Policy) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">2. Filter Tabs & Navigation (Zero-Emoji Policy)</CardTitle>
          <CardDescription className="text-xs">
            Clean typographic labels with count metrics. Zero emojis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5 border rounded-lg bg-muted/40 p-1 self-start">
            {[
              { key: "all", label: "All Users", count: 1248 },
              { key: "paid", label: "Paid Users", count: 186 },
              { key: "free", label: "Registered Users", count: 1062 },
              { key: "admin", label: "Admins", count: 2 },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs rounded-md"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label} ({tab.count})
              </Button>
            ))}
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
            <strong>Rule:</strong> Never prepend icons like 🟢 or 🛡️ to tab buttons. High-contrast active tab state already provides instantaneous clarity.
          </div>
        </CardContent>
      </Card>

      {/* 5. Buttons & Action Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">3. Action Button Hierarchy</CardTitle>
          <CardDescription className="text-xs">
            Strict 4-level order ensuring buttons never compete for visual attention.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Primary */}
            <Button size="sm" className="text-xs">
              Primary Action (e.g. Save / Confirm)
            </Button>

            {/* Secondary / Outline */}
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>

            {/* Icon / Ghost Shortcuts */}
            <Button variant="ghost" size="icon-sm" className="h-8 w-8" title="WhatsApp Shortcut">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8" title="View Profile">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8" title="Copy Contact">
              <Copy className="h-4 w-4" />
            </Button>

            {/* Destructive */}
            <Button variant="destructive" size="sm" className="text-xs">
              Destructive Action (e.g. Ban User)
            </Button>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
            <strong>Rule:</strong> WhatsApp buttons should use a clean <code className="text-foreground">variant=&quot;ghost&quot;</code> or <code className="text-foreground">variant=&quot;outline&quot;</code> instead of bright glaring green backgrounds.
          </div>
        </CardContent>
      </Card>

      {/* 6. Standardized KPI Metric Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">4. Standardized KPI Metric Cards</CardTitle>
          <CardDescription className="text-xs">
            Uniform card height, clean typography, neutral icon treatments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Accounts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">1,248</div>
                  <Badge variant="outline" className="text-[10px] font-normal">2 Admins</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">All portal registrations</p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Paid Users</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">186</div>
                  <Badge variant="outline" className="gap-1 text-[10px] font-normal">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 15% of total
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">₹4,82,500 total collected</p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Registered Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">1,062</div>
                  <Badge variant="outline" className="text-[10px] font-normal">85% of total</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Standard exploratory accounts</p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">14.9%</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Paid vs Registered ratio</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* 7. Universal Typography & Component Density Scale */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">5. Universal Typography Scale & Component Density Architecture</CardTitle>
          <CardDescription className="text-xs">
            Single standard sans font family (Geist / Inter) across all components. Strict layer separation so cards and tables do not mix font sizes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="text-xs font-semibold text-primary">Tier 1: KPI Metric Cards</div>
              <div className="text-xs text-muted-foreground">Executive Overview</div>
              <div className="pt-2">
                <div className="text-xl font-bold">₹1,24,000</div>
                <div className="text-[11px] text-muted-foreground">text-2xl font-bold (24px)</div>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="text-xs font-semibold text-primary">Tier 2: Table Rows</div>
              <div className="text-xs text-muted-foreground">Data Dense Layout</div>
              <div className="pt-2">
                <div className="text-xs font-semibold">₹7,498 (LTV)</div>
                <div className="text-[11px] text-muted-foreground">text-xs font-semibold (12px)</div>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="text-xs font-semibold text-primary">Tier 3: Micro-Badges</div>
              <div className="text-xs text-muted-foreground">Semantic Indicators</div>
              <div className="pt-2 flex items-center gap-1.5">
                <Badge variant="outline" className="gap-1 text-[10px] font-normal py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Paid User
                </Badge>
                <div className="text-[11px] text-muted-foreground">text-[10px]</div>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="text-xs font-semibold text-primary">Tier 4: Drawers & Sheets</div>
              <div className="text-xs text-muted-foreground">360° Detailed Audit</div>
              <div className="pt-2">
                <div className="text-sm font-bold">User Profile</div>
                <div className="text-[11px] text-muted-foreground">text-base / uppercase headers</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
            <p><strong>Universal Font Rule:</strong> Entire dashboard strictly uses <code className="text-foreground">font-sans</code> for both text and numbers. Never apply monospace fonts to normal financial or row numbers.</p>
            <p><strong>Column Flow Rule:</strong> Always place <code className="text-foreground">Customer Type</code> before <code className="text-foreground">Lifetime Value</code>. Lifetime Value must be right-aligned next to Actions.</p>
          </div>
        </CardContent>
      </Card>

      {/* 8. Executive Table Layout Sample */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">6. Executive Table Architecture</CardTitle>
          <CardDescription className="text-xs">
            Clean typography, swapped Customer Type & Lifetime Value columns, direct View action icon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[260px]">User Account</TableHead>
                <TableHead className="w-[220px]">Contact Info</TableHead>
                <TableHead className="w-[180px]">Company / Interest</TableHead>
                <TableHead className="w-[140px]">Customer Type</TableHead>
                <TableHead className="w-[120px] text-right">Lifetime Value</TableHead>
                <TableHead className="text-right w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="h-[52px] hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 border shrink-0">
                      <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                        RK
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-foreground">Rajesh Kumar</div>
                      <div className="text-[11px] text-muted-foreground">Joined Nov 20, 2026</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-foreground font-medium">rajesh@gmail.com</div>
                  <div className="text-[11px] text-muted-foreground">+91 98765 43210</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-medium text-foreground">Bharat Electronics</div>
                  <div className="text-[11px] text-muted-foreground">GeM Bidding Masterclass</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1 text-[10px] font-normal">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Paid User
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-xs font-semibold text-foreground">₹7,498</div>
                  <div className="text-[10px] text-muted-foreground">2 orders</div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:scale-110 active:scale-95" title="View Profile">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              <TableRow className="h-[52px] hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 border shrink-0">
                      <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                        AV
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-foreground">Amit Verma</div>
                      <div className="text-[11px] text-muted-foreground">Joined Nov 22, 2026</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-foreground font-medium">amit@yahoo.com</div>
                  <div className="text-[11px] text-muted-foreground">+91 98111 22334</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-medium text-foreground">Self-employed</div>
                  <div className="text-[11px] text-muted-foreground">Seller Registration</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1 text-[10px] font-normal text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    Registered User
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-xs font-semibold text-foreground">—</div>
                  <div className="text-[10px] text-muted-foreground">0 orders</div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:scale-110 active:scale-95" title="View Profile">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
