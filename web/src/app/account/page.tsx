"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { User, Settings, Users, Save, Mail, UserPlus, Trash2, Crown, Shield, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, AvatarBadge } from "@/components/ui/avatar";
import { ImageUploader } from "@/components/ImageUploader";
import { TeamManagement } from "@/components/TeamManagement";

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading account settings...</div>}>
      <AccountContent />
    </Suspense>
  )
}

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "profile";

  const setActiveTab = (tab: string) => {
    router.replace(`/account?tab=${tab}`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">My Account</h1>
        <p className="text-muted-foreground mt-1 font-bold">Manage your profile, preferences, and team members.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar for Account */}
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={activeTab === "profile"} 
              onClick={() => setActiveTab("profile")}
            >
              <User /> <span>Profile Details</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={activeTab === "settings"} 
              onClick={() => setActiveTab("settings")}
            >
              <Settings /> <span>Account Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={activeTab === "team"} 
              onClick={() => setActiveTab("team")}
            >
              <Users /> <span>Team Management</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          
          {activeTab === "profile" && (
            <Card className="animate-in fade-in duration-300 slide-in-from-right-4 bg-secondary-background">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Update your personal information and contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
                  <Avatar className="size-20 shadow-shadow shrink-0">
                    <AvatarFallback className="text-2xl font-heading bg-main text-main-foreground">RA</AvatarFallback>
                  </Avatar>
                  <div className="w-full max-w-sm">
                    <Label className="mb-2 block text-sm font-bold">Profile Picture</Label>
                    <ImageUploader 
                      defaultTitle="Upload new avatar"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input defaultValue="Restaurant" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input defaultValue="Admin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input defaultValue="admin@restaurant.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input defaultValue="+91 98765 43210" />
                </div>
              </CardContent>
              <CardFooter className="border-t-2 border-border bg-muted/20 px-6 py-4">
                <Button onClick={() => toast.add({ type: "success", title: "Success", description: "Profile details updated." })}><Save className="w-4 h-4 mr-2" /> Save Profile</Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card className="animate-in fade-in duration-300 slide-in-from-right-4 bg-secondary-background">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Configure your preferences and weekly reports.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-heading text-lg font-bold mb-4 border-b-2 border-border pb-2">Weekly Reports</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-bold">Email Reports</Label>
                        <p className="text-sm text-muted-foreground font-bold">Receive a weekly summary in your inbox.</p>
                      </div>
                      <Switch defaultChecked onCheckedChange={(c) => toast.add({ description: c ? "Email reports enabled." : "Email reports disabled." })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-bold">WhatsApp Reports</Label>
                        <p className="text-sm text-muted-foreground font-bold">Get a quick text summary every Monday morning.</p>
                      </div>
                      <Switch onCheckedChange={(c) => toast.add({ description: c ? "WhatsApp reports enabled." : "WhatsApp reports disabled." })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-bold">Detailed PDF Attachments</Label>
                        <p className="text-sm text-muted-foreground font-bold">Include a full PDF breakdown of item-wise sales.</p>
                      </div>
                      <Switch defaultChecked onCheckedChange={(c) => toast.add({ description: c ? "PDF attachments enabled." : "PDF attachments disabled." })} />
                    </div>
                  </div>
                </div>
                
                <div className="pt-6">
                  <h3 className="font-heading text-lg font-bold mb-4 border-b-2 border-border pb-2">Security</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                      </div>
                      <Button variant="outline" onClick={() => toast.add({ type: "info", description: "2FA setup instructions sent to email." })}>Enable 2FA</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t-2 border-border bg-muted/20 px-6 py-4">
                <Button onClick={() => toast.add({ type: "success", title: "Saved", description: "Account preferences saved." })}><Save className="w-4 h-4 mr-2" /> Save Preferences</Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === "team" && (
            <Card className="animate-in fade-in duration-300 slide-in-from-right-4 bg-secondary-background">
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Manage who has access to your restaurant dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                <TeamManagement />
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
