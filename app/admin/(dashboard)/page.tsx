"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Folder as FolderIcon, 
  Plus as PlusIcon, 
  Trash as TrashIcon, 
  Globe as GlobeIcon, 
  GithubLogo as GithubLogoIcon, 
  SignOut as SignOutIcon, 
  Image as ImageIcon, 
  Monitor as MonitorIcon, 
  DeviceMobile as DeviceMobileIcon, 
  Spinner as SpinnerIcon, 
  CheckCircle as CheckCircleIcon, 
  XCircle as XCircleIcon, 
  PencilSimple as PencilSimpleIcon, 
  Gear as GearIcon,
  House as HouseIcon
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface ProjectItem {
  _id: string;
  title: string;
  liveUrl?: string;
  githubUrl?: string;
  mobileImage?: string;
  desktopImage?: string;
  featured: boolean;
  createdAt: string;
}

export default function Admin() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"list" | "create" | "settings">("list");
  
  // Projects state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  
  // Image Upload states
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);
  const [isMobileUploading, setIsMobileUploading] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);

  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [desktopUrl, setDesktopUrl] = useState<string | null>(null);
  const [isDesktopUploading, setIsDesktopUploading] = useState(false);
  const [desktopError, setDesktopError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settings states
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsHandle, setSettingsHandle] = useState("");
  const [githubUrlSetting, setGithubUrlSetting] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [behanceUrl, setBehanceUrl] = useState("");
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push("/admin/login");
    }
  }, [session, isSessionLoading, router]);

  // Fetch projects on load
  const fetchProjects = useCallback(async () => {
    try {
      setIsProjectsLoading(true);
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to load projects");
    } finally {
      setIsProjectsLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setIsSettingsLoading(true);
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettingsEmail(data.email || "");
      setSettingsHandle(data.handle || "");
      setGithubUrlSetting(data.githubUrl || "");
      setLinkedinUrl(data.linkedinUrl || "");
      setInstagramUrl(data.instagramUrl || "");
      setTwitterUrl(data.twitterUrl || "");
      setBehanceUrl(data.behanceUrl || "");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to load settings");
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    const saveToast = toast.loading("Saving settings...");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: settingsEmail,
          handle: settingsHandle,
          githubUrl: githubUrlSetting,
          linkedinUrl,
          instagramUrl,
          twitterUrl,
          behanceUrl,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update settings");
      }

      toast.success("Settings updated successfully!", { id: saveToast });
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to update settings", { id: saveToast });
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    if (session) {
      const timer = setTimeout(() => {
        fetchProjects();
        fetchSettings();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [session, fetchProjects, fetchSettings]);

  // Pagination calculations
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(projects.length / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);

  const paginatedProjects = projects.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  const getPaginationRange = (current: number, total: number) => {
    const range: (number | "ellipsis")[] = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      range.push(1);
      if (current > 3) {
        range.push("ellipsis");
      }
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) {
        if (!range.includes(i)) range.push(i);
      }
      if (current < total - 2) {
        range.push("ellipsis");
      }
      if (!range.includes(total)) range.push(total);
    }
    return range;
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const logoutToast = toast.loading("Logging out...");
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Logged out successfully", { id: logoutToast });
            window.location.replace("/admin/login");
          },
          onError: (ctx) => {
            setIsLoggingOut(false);
            toast.error(ctx.error.message || "Logout failed", { id: logoutToast });
          }
        },
      });
    } catch {
      setIsLoggingOut(false);
      toast.error("An error occurred during logout", { id: logoutToast });
    }
  };

  // Generic Image Uploader helper
  const uploadImage = async (file: File, type: "mobile" | "desktop") => {
    const setUploading = type === "mobile" ? setIsMobileUploading : setIsDesktopUploading;
    const setUrl = type === "mobile" ? setMobileUrl : setDesktopUrl;
    const setError = type === "mobile" ? setMobileError : setDesktopError;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await res.json();
      setUrl(data.url);
      toast.success(`${type === "mobile" ? "Mobile" : "Desktop"} image uploaded successfully`);
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setError(error.message || "Failed to upload image");
      toast.error(error.message || `Failed to upload ${type} image`);
    } finally {
      setUploading(false);
    }
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMobilePreview(URL.createObjectURL(file));
      uploadImage(file, "mobile");
    }
  };

  const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesktopPreview(URL.createObjectURL(file));
      uploadImage(file, "desktop");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    const deleteToast = toast.loading("Deleting project...");
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete project");
      }

      toast.success("Project deleted successfully", { id: deleteToast });
      fetchProjects();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to delete project", { id: deleteToast });
    }
  };

  const handleEditClick = (proj: ProjectItem) => {
    setEditingProjectId(proj._id);
    setTitle(proj.title);
    setLiveUrl(proj.liveUrl || "");
    setGithubUrl(proj.githubUrl || "");
    setMobilePreview(proj.mobileImage || null);
    setMobileUrl(proj.mobileImage || null);
    setDesktopPreview(proj.desktopImage || null);
    setDesktopUrl(proj.desktopImage || null);
    setActiveTab("create");
  };

  const handleToggleFeatured = async (proj: ProjectItem) => {
    const isCurrentlyFeatured = proj.featured;
    
    if (!isCurrentlyFeatured) {
      const currentlyFeaturedCount = projects.filter((p) => p.featured).length;
      if (currentlyFeaturedCount >= 4) {
        toast.error("You can only select exactly 4 projects to display in the carousel. Please unselect another project first.");
        return;
      }
    }

    // Optimistic UI update
    setProjects(prev => prev.map(p => p._id === proj._id ? { ...p, featured: !isCurrentlyFeatured } : p));
    
    try {
      const res = await fetch(`/api/projects/${proj._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featured: !isCurrentlyFeatured }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update carousel preference");
      }

      toast.success(isCurrentlyFeatured ? "Removed from carousel" : "Added to carousel");
    } catch (err) {
      const error = err as Error;
      // Revert UI on error
      setProjects(prev => prev.map(p => p._id === proj._id ? { ...p, featured: isCurrentlyFeatured } : p));
      toast.error(error.message || "Failed to update carousel preference");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      toast.error("Project name is required");
      return;
    }

    if (isMobileUploading || isDesktopUploading) {
      toast.error("Please wait for images to finish uploading");
      return;
    }

    setIsSubmitting(true);
    const isEditing = editingProjectId !== null;
    const submitToast = toast.loading(isEditing ? "Saving changes..." : "Creating project...");

    try {
      const url = isEditing ? `/api/projects/${editingProjectId}` : "/api/projects";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          liveUrl,
          githubUrl,
          mobileImage: mobileUrl || undefined,
          desktopImage: desktopUrl || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Failed to ${isEditing ? "update" : "create"} project`);
      }

      toast.success(isEditing ? "Project updated successfully!" : "Project created successfully!", { id: submitToast });
      
      // Reset form
      setTitle("");
      setLiveUrl("");
      setGithubUrl("");
      setMobilePreview(null);
      setMobileUrl(null);
      setDesktopPreview(null);
      setDesktopUrl(null);
      setEditingProjectId(null);
      
      // Refresh list & switch tab
      fetchProjects();
      setActiveTab("list");
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || `Failed to ${isEditing ? "update" : "create"} project`, { id: submitToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSessionLoading || !session) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <SpinnerIcon className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Authenticating session...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="flex items-center gap-3 p-6 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center bg-primary text-primary-foreground font-black text-xl tracking-tighter">
            S
          </div>
          <div>
            <h1 className="font-heading font-black tracking-tight uppercase text-md">Subhajit</h1>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Admin Portal</p>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-4">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeTab === "list"}
                    onClick={() => setActiveTab("list")}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold tracking-wide transition-all border-l-2 data-active:border-primary data-active:bg-primary/5 data-active:text-primary border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <FolderIcon size={18} />
                    <span>Manage Projects</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeTab === "create"}
                    onClick={() => {
                      setActiveTab("create");
                      if (!editingProjectId) {
                        // reset fields in case we were editing
                        setTitle("");
                        setLiveUrl("");
                        setGithubUrl("");
                        setMobilePreview(null);
                        setMobileUrl(null);
                        setDesktopPreview(null);
                        setDesktopUrl(null);
                      }
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold tracking-wide transition-all border-l-2 data-active:border-primary data-active:bg-primary/5 data-active:text-primary border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <PlusIcon size={18} />
                    <span>{editingProjectId ? "Edit Project" : "Add New Project"}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeTab === "settings"}
                    onClick={() => setActiveTab("settings")}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold tracking-wide transition-all border-l-2 data-active:border-primary data-active:bg-primary/5 data-active:text-primary border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <GearIcon size={18} />
                    <span>Social Profiles</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-xs">
              {session.user.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{session.user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors text-xs py-2 h-auto cursor-pointer"
          >
            {isLoggingOut ? (
              <SpinnerIcon className="h-4 w-4 animate-spin" />
            ) : (
              <SignOutIcon size={16} />
            )}
            <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col flex-1 overflow-x-hidden">
        <div className="flex h-16 items-center gap-4 border-b border-border px-6">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <HouseIcon size={14} className="text-muted-foreground/80" />
            <span>Admin</span>
            <span>/</span>
            <span className="capitalize">{activeTab === "list" ? "projects" : activeTab === "create" ? "project editor" : "settings"}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl">
          
          {/* Header */}
          <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-heading font-black tracking-tight uppercase md:text-3xl">
                {activeTab === "list" 
                  ? "Projects Catalog" 
                  : activeTab === "settings" 
                    ? "Social Profiles" 
                    : editingProjectId 
                      ? "Edit Project" 
                      : "Add Project"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab === "list" 
                  ? "View and manage all registered portfolio showcase projects." 
                  : activeTab === "settings"
                    ? "Configure your public contact information and social handles."
                    : editingProjectId
                      ? "Modify details and screenshots of the selected project."
                      : "Create a new project entry with desktop and mobile view media."}
              </p>
            </div>
            {activeTab === "list" && (
              <Button 
                onClick={() => {
                  setEditingProjectId(null);
                  setTitle("");
                  setLiveUrl("");
                  setGithubUrl("");
                  setMobilePreview(null);
                  setMobileUrl(null);
                  setDesktopPreview(null);
                  setDesktopUrl(null);
                  setActiveTab("create");
                }} 
                className="flex items-center gap-2 text-xs py-2 h-auto cursor-pointer"
              >
                <PlusIcon size={16} />
                <span>New Project</span>
              </Button>
            )}
          </header>

          {/* TAB 1: List Projects */}
          {activeTab === "list" && (
            <div className="flex flex-col gap-4">
              {isProjectsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 bg-card border border-border">
                  <SpinnerIcon className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading projects list...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-card border border-border">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                    <FolderIcon size={24} />
                  </div>
                  <h3 className="font-bold text-sm">No Projects Listed</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
                    You haven&apos;t created any showcase projects yet. Start by uploading one now!
                  </p>
                  <Button onClick={() => setActiveTab("create")} className="text-xs py-2 h-auto cursor-pointer">
                    <PlusIcon size={16} className="mr-2" />
                    Create First Project
                  </Button>
                </div>
              ) : (
                <>
                  <div className="border border-border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 uppercase tracking-wider text-[10px] font-bold">
                          <TableHead className="px-6 py-4 font-bold">Project Title</TableHead>
                          <TableHead className="px-6 py-4 hidden sm:table-cell font-bold">Desktop Screen</TableHead>
                          <TableHead className="px-6 py-4 hidden sm:table-cell font-bold">Mobile Screen</TableHead>
                          <TableHead className="px-6 py-4 font-bold">Show in Carousel</TableHead>
                          <TableHead className="px-6 py-4 font-bold">Links</TableHead>
                          <TableHead className="px-6 py-4 text-right font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedProjects.map((proj) => (
                          <TableRow key={proj._id} className="hover:bg-muted/10 transition-colors text-xs">
                            <TableCell className="px-6 py-4 font-bold max-w-[200px] truncate">
                              <div>
                                <p className="font-bold">{proj.title}</p>
                                <p className="text-[9px] text-muted-foreground font-normal mt-0.5">
                                  Added on {new Date(proj.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </TableCell>
                            
                            {/* Desktop Image Cell */}
                            <TableCell className="px-6 py-4 hidden sm:table-cell">
                              {proj.desktopImage ? (
                                <div className="group relative h-10 w-16 overflow-hidden border border-border bg-muted">
                                  <img 
                                    src={proj.desktopImage} 
                                    alt={`${proj.title} desktop`} 
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    loading="lazy"
                                  />
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">None</span>
                              )}
                            </TableCell>

                            {/* Mobile Image Cell */}
                            <TableCell className="px-6 py-4 hidden sm:table-cell">
                              {proj.mobileImage ? (
                                <div className="group relative h-10 w-7 overflow-hidden border border-border bg-muted">
                                  <img 
                                    src={proj.mobileImage} 
                                    alt={`${proj.title} mobile`} 
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    loading="lazy"
                                  />
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">None</span>
                              )}
                            </TableCell>

                            {/* Show in Carousel Cell */}
                            <TableCell className="px-6 py-4">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={proj.featured || false}
                                  onChange={() => handleToggleFeatured(proj)}
                                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer accent-primary"
                                />
                              </label>
                            </TableCell>

                            {/* Links Cell */}
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {proj.liveUrl ? (
                                  <a 
                                    href={proj.liveUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                    title="Live Site"
                                  >
                                    <GlobeIcon size={16} />
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground/30"><GlobeIcon size={16} /></span>
                                )}
                                
                                {proj.githubUrl ? (
                                  <a 
                                    href={proj.githubUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                    title="GitHub Code"
                                  >
                                    <GithubLogoIcon size={16} />
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground/30"><GithubLogoIcon size={16} /></span>
                                )}
                              </div>
                            </TableCell>

                            {/* Actions Cell */}
                            <TableCell className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditClick(proj)}
                                  className="h-8 w-8 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-muted-foreground cursor-pointer"
                                  title="Edit Project"
                                >
                                  <PencilSimpleIcon size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDeleteProject(proj._id)}
                                  className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors text-muted-foreground cursor-pointer"
                                  title="Delete Project"
                                >
                                  <TrashIcon size={14} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <Pagination className="mt-4">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) setCurrentPage(currentPage - 1);
                            }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {getPaginationRange(currentPage, totalPages).map((page, idx) => (
                          <PaginationItem key={idx}>
                            {page === "ellipsis" ? (
                              <PaginationEllipsis />
                            ) : (
                              <PaginationLink
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                            }}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: Create Project */}
          {activeTab === "create" && (
            <div className="bg-card border border-border p-6 md:p-8">
              <form onSubmit={handleCreateProject} className="space-y-6 max-w-4xl">
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="md:col-span-3">
                    <Field>
                      <FieldLabel htmlFor="title" className="text-xs font-bold uppercase tracking-wider">Project Name / Title</FieldLabel>
                      <Input
                        id="title"
                        placeholder="e.g. Studio Pomelo"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </Field>
                  </div>

                  <div className="md:col-span-1.5">
                    <Field>
                      <FieldLabel htmlFor="liveUrl" className="text-xs font-bold uppercase tracking-wider">Live URL (Optional)</FieldLabel>
                      <Input
                        id="liveUrl"
                        placeholder="https://example.com"
                        value={liveUrl}
                        onChange={(e) => setLiveUrl(e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="md:col-span-1.5">
                    <Field>
                      <FieldLabel htmlFor="githubUrl" className="text-xs font-bold uppercase tracking-wider">GitHub Link (Optional)</FieldLabel>
                      <Input
                        id="githubUrl"
                        placeholder="https://github.com/username/repo"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                      />
                    </Field>
                  </div>
                </div>

                {/* Image Previews & Selection Zone */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 pt-4">
                  
                  {/* Desktop Image upload */}
                  <div className="flex flex-col gap-2">
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <MonitorIcon size={14} />
                      <span>Desktop Screen Media</span>
                    </FieldLabel>
                    
                    <div className="relative group flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 transition-colors p-4 min-h-[220px] bg-muted/20">
                      
                      {/* Real Image Preview Window */}
                      {desktopPreview ? (
                        <div className="relative w-full aspect-video overflow-hidden border border-border bg-black">
                          <img 
                            src={desktopPreview} 
                            alt="Desktop preview" 
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          
                          {/* Overlay Status */}
                          {isDesktopUploading ? (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-white">
                              <SpinnerIcon className="h-6 w-6 animate-spin" />
                              <span className="text-[10px] font-semibold tracking-wider uppercase">Uploading...</span>
                            </div>
                          ) : desktopUrl ? (
                            <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 flex items-center justify-center">
                              <CheckCircleIcon size={14} weight="fill" />
                            </div>
                          ) : desktopError ? (
                            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-4 text-center text-destructive">
                              <XCircleIcon size={24} weight="fill" className="mb-1" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Upload Failed</span>
                              <span className="text-[9px] mt-1 text-muted-foreground">{desktopError}</span>
                            </div>
                          ) : null}

                          {/* Remove button */}
                          {!isDesktopUploading && (
                            <button
                              type="button"
                              onClick={() => {
                                setDesktopPreview(null);
                                setDesktopUrl(null);
                                setDesktopError(null);
                              }}
                              className="absolute bottom-2 right-2 px-2 py-1 bg-black/65 text-white hover:bg-destructive transition-colors text-[9px] font-bold uppercase tracking-wider"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full py-8">
                          <ImageIcon size={32} className="text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                          <span className="text-xs font-semibold">Select desktop screen image</span>
                          <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WebP up to 10MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleDesktopFileChange}
                            disabled={isDesktopUploading}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Mobile Image upload */}
                  <div className="flex flex-col gap-2">
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <DeviceMobileIcon size={14} />
                      <span>Mobile Screen Media</span>
                    </FieldLabel>
                    
                    <div className="relative group flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 transition-colors p-4 min-h-[220px] bg-muted/20">
                      
                      {/* Real Image Preview Window */}
                      {mobilePreview ? (
                        <div className="relative h-[180px] aspect-[9/16] overflow-hidden border border-border bg-black">
                          <img 
                            src={mobilePreview} 
                            alt="Mobile preview" 
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          
                          {/* Overlay Status */}
                          {isMobileUploading ? (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-white">
                              <SpinnerIcon className="h-6 w-6 animate-spin" />
                              <span className="text-[10px] font-semibold tracking-wider uppercase">Uploading...</span>
                            </div>
                          ) : mobileUrl ? (
                            <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 flex items-center justify-center">
                              <CheckCircleIcon size={14} weight="fill" />
                            </div>
                          ) : mobileError ? (
                            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-2 text-center text-destructive">
                              <XCircleIcon size={20} weight="fill" className="mb-1" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">Upload Failed</span>
                              <span className="text-[8px] mt-0.5 text-muted-foreground truncate max-w-full">{mobileError}</span>
                            </div>
                          ) : null}

                          {/* Remove button */}
                          {!isMobileUploading && (
                            <button
                              type="button"
                              onClick={() => {
                                setMobilePreview(null);
                                setMobileUrl(null);
                                setMobileError(null);
                              }}
                              className="absolute bottom-2 right-2 px-2 py-1 bg-black/65 text-white hover:bg-destructive transition-colors text-[9px] font-bold uppercase tracking-wider"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full py-8">
                          <ImageIcon size={32} className="text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                          <span className="text-xs font-semibold">Select mobile screen image</span>
                          <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WebP up to 10MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleMobileFileChange}
                            disabled={isMobileUploading}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                </div>

                {/* Submit Buttons */}
                <div className="flex items-center gap-4 pt-4 border-t border-border mt-8">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || isMobileUploading || isDesktopUploading}
                    className="flex items-center gap-2 text-xs py-2 h-auto cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <SpinnerIcon className="h-4 w-4 animate-spin" />
                        <span>{editingProjectId ? "Saving Changes..." : "Creating Project..."}</span>
                      </>
                    ) : (
                      <>
                        {editingProjectId ? <CheckCircleIcon size={16} /> : <PlusIcon size={16} />}
                        <span>{editingProjectId ? "Save Changes" : "Create Project"}</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setActiveTab("list");
                      setEditingProjectId(null);
                      setTitle("");
                      setLiveUrl("");
                      setGithubUrl("");
                      setMobilePreview(null);
                      setMobileUrl(null);
                      setDesktopPreview(null);
                      setDesktopUrl(null);
                    }}
                    className="text-xs py-2 h-auto cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Settings */}
          {activeTab === "settings" && (
            <div className="bg-card border border-border p-6 md:p-8">
              {isSettingsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <SpinnerIcon className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading settings...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-4">
                        General Information
                      </h3>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="profileEmail" className="text-xs font-bold uppercase tracking-wider">Public Email</FieldLabel>
                      <Input
                        id="profileEmail"
                        placeholder="e.g. hello@example.com"
                        value={settingsEmail}
                        onChange={(e) => setSettingsEmail(e.target.value)}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="profileHandle" className="text-xs font-bold uppercase tracking-wider">Profile Handle</FieldLabel>
                      <Input
                        id="profileHandle"
                        placeholder="e.g. @username"
                        value={settingsHandle}
                        onChange={(e) => setSettingsHandle(e.target.value)}
                        required
                      />
                    </Field>

                    <div className="md:col-span-2 pt-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-4">
                        Social Profiles
                      </h3>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="linkedinUrl" className="text-xs font-bold uppercase tracking-wider">LinkedIn URL</FieldLabel>
                      <Input
                        id="linkedinUrl"
                        placeholder="https://linkedin.com/in/username"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="githubUrlSetting" className="text-xs font-bold uppercase tracking-wider">GitHub URL</FieldLabel>
                      <Input
                        id="githubUrlSetting"
                        placeholder="https://github.com/username"
                        value={githubUrlSetting}
                        onChange={(e) => setGithubUrlSetting(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="instagramUrl" className="text-xs font-bold uppercase tracking-wider">Instagram URL</FieldLabel>
                      <Input
                        id="instagramUrl"
                        placeholder="https://instagram.com/username"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="twitterUrl" className="text-xs font-bold uppercase tracking-wider">Twitter/X URL</FieldLabel>
                      <Input
                        id="twitterUrl"
                        placeholder="https://x.com/username"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                      />
                    </Field>
                    <Field className="md:col-span-2">
                      <FieldLabel htmlFor="behanceUrl" className="text-xs font-bold uppercase tracking-wider">Behance URL</FieldLabel>
                      <Input
                        id="behanceUrl"
                        placeholder="https://behance.net/username"
                        value={behanceUrl}
                        onChange={(e) => setBehanceUrl(e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-border mt-8">
                    <Button 
                      type="submit" 
                      disabled={isSavingSettings}
                      className="flex items-center gap-2 text-xs py-2 h-auto cursor-pointer"
                    >
                      {isSavingSettings ? (
                        <>
                          <SpinnerIcon className="h-4 w-4 animate-spin" />
                          <span>Saving Settings...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon size={16} />
                          <span>Save Settings</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

        </main>
      </SidebarInset>
    </SidebarProvider>
  );

}
