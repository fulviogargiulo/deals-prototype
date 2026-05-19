import { Plus, ChevronDown, Bell, User as UserIcon, FileText, User, Shield, HelpCircle, Lock, LogOut, ChevronRight, ChevronLeft, Pencil, Menu, CalendarClock, X, ExternalLink, Globe, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GlobalSearch } from "./global-search";
import { NewClientModal } from "@/components/modals/new-client-modal";
import { NewOpportunityModal } from "@/components/modals/new-opportunity-modal";
import { NewTaskModal } from "@/components/modals/new-task-modal";
import { NewDocumentModal } from "@/components/modals/new-document-modal";
import { EditPhoneModal } from "@/components/modals/edit-phone-modal";
import { EditEmailModal } from "@/components/modals/edit-email-modal";
import { EditProfilePictureModal } from "@/components/modals/edit-profile-picture-modal";
import { useSidebar } from "@/hooks/use-sidebar";
import { useDevTools } from "@/contexts/dev-tools-context";
import { usePageTitle } from "@/contexts/page-title-context";
import { sharedAgents } from "@huspy/shared-domain";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScheduleSideMenu } from "@/components/schedule/schedule-side-menu";
import { HeaderBreadcrumbs } from "./header-breadcrumbs";
import { useLanguage } from "@/contexts/language-context";

export function TopBar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { headerVisibility, headerTitleMode, activeAgentId, setActiveAgentId } = useDevTools();
  const activeAgent = sharedAgents.find(a => a.id === activeAgentId) ?? sharedAgents[0];
  const countryFlag: Record<string, string> = { es: '🇪🇸', ae: '🇦🇪', sa: '🇸🇦' };
  const { pageTitle, pageTitleContent, isTitleVisible, transparentHeader } = usePageTitle();
  const navigate = useNavigate();
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [newOpportunityModalOpen, setNewOpportunityModalOpen] = useState(false);
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [newDocumentModalOpen, setNewDocumentModalOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);
  const [showLanguagePanel, setShowLanguagePanel] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'back'>('forward');
  const { language, setLanguage, t } = useLanguage();
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("+ 34 633 222 222");
  const [email, setEmail] = useState("pedro.torres@gmail.com");
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position for header opacity with hysteresis to prevent flickering
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Use hysteresis: different thresholds for scrolling down vs up
      if (scrollY > 15) {
        setIsScrolled(true);
      } else if (scrollY < 5) {
        setIsScrolled(false);
      }
      // Between 5-15px, maintain current state (hysteresis zone)
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle Escape key for sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && profileSheetOpen && !phoneModalOpen && !emailModalOpen) {
        e.preventDefault();
        setProfileSheetOpen(false);
        setShowPersonalDetails(false);
        setShowLanguagePanel(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [profileSheetOpen, phoneModalOpen, emailModalOpen]);

  // Determine header background based on transparent mode and scroll state
  const getHeaderBackground = () => {
    if (transparentHeader) {
      if (isScrolled) {
        return "bg-white/60 dark:bg-background/60";
      }
      return "bg-transparent";
    }
    // Default behavior
    return isScrolled 
      ? "bg-white/60 dark:bg-background/60" 
      : "bg-white/95 dark:bg-background/95";
  };

  // Determine if we should apply backdrop blur
  const shouldBlur = transparentHeader ? isScrolled : true;
  
  return (
    <>
      <header 
        className={cn(
          "h-16 flex items-center px-4 sm:px-6 fixed top-0 right-0 z-40 transition-all duration-500",
          shouldBlur && "backdrop-blur-xl",
          getHeaderBackground()
        )}
        style={{ left: isCollapsed ? '0px' : '256px' }}
      >
        {/* Menu Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "h-9 w-9 p-0 rounded-xl shrink-0 relative z-20 transition-all duration-500",
            transparentHeader && !isScrolled 
              ? "bg-white/15 hover:bg-white/25" 
              : "hover:bg-muted/60"
          )}
        >
          <Menu 
            className="h-5 w-5 transition-colors duration-500"
            style={{ color: transparentHeader && !isScrolled ? 'white' : undefined }}
          />
        </Button>

        {/* Breadcrumbs - only when tracked titles are off */}
        {headerTitleMode !== 'tracked-title' && (
          <div className="ml-2 min-w-0 hidden sm:block">
            <HeaderBreadcrumbs transparentHeader={transparentHeader} isScrolled={isScrolled} />
          </div>
        )}

        {/* Page Title - only shown when headerTitleMode is 'tracked-title' */}
        {headerTitleMode === 'tracked-title' && (
          <div 
            className={cn(
              "absolute inset-0 flex items-center pointer-events-none transition-all duration-200",
              !isTitleVisible && (pageTitle || pageTitleContent) ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 flex items-center">
              <div
                className="pointer-events-auto flex items-center gap-2 min-w-0 flex-1 pr-24 sm:pr-28"
                style={{
                  marginLeft: 'max(0px, calc(60px - var(--container-padding)))',
                }}
              >
                <style>{`
                  :root { --container-padding: 1rem; }
                  @media (min-width: 640px) { :root { --container-padding: 1.5rem; } }
                  @media (min-width: 1024px) { :root { --container-padding: 2rem; } }
                  @media (min-width: 1280px) { :root { --container-padding: 3rem; } }
                  @media (min-width: 1536px) { :root { --container-padding: 4rem; } }
                `}</style>
                {pageTitleContent ? (
                  pageTitleContent
                ) : (
                  <h1 className="font-semibold text-lg truncate">
                    {pageTitle}
                  </h1>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Spacer to push right content */}
        <div className="flex-1" />

        {/* Centered Search */}
        {headerVisibility.showSearch && (
          <div className="flex-1 flex justify-center max-w-2xl">
            <GlobalSearch className="w-full" />
          </div>
        )}
        
        {/* Spacer when search is hidden */}
        {!headerVisibility.showSearch && <div className="flex-1" />}

        {/* Right Side Actions - z-20 to stay above the absolute title overlay */}
        <div className="flex items-center gap-3 relative z-20">
          {/* Notifications */}
          {headerVisibility.showNotifications && (
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-9 w-9 p-0 relative rounded-xl transition-all duration-500",
                transparentHeader && !isScrolled 
                  ? "bg-white/15 hover:bg-white/25" 
                  : "hover:bg-muted/60"
              )}
            >
              <Bell 
                className="h-4 w-4 transition-colors duration-500"
                style={{ color: transparentHeader && !isScrolled ? 'white' : undefined }}
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-xs text-destructive-foreground font-bold">3</span>
              </div>
            </Button>
          )}

          {/* Theme Toggle */}
          {headerVisibility.showThemeToggle && <ThemeToggle />}

          {/* Dev: Agent selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-full px-3 text-xs font-semibold bg-surface-ds-raised border-0"
              >
                <span>{countryFlag[activeAgent.country ?? ''] ?? '🌍'}</span>
                <span className="hidden sm:inline text-fg-secondary">{activeAgent.id}</span>
                <ChevronDown className="w-3 h-3 text-fg-secondary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {sharedAgents.map(agent => (
                <DropdownMenuItem
                  key={agent.id}
                  onClick={() => setActiveAgentId(agent.id)}
                  className="flex items-center gap-2 text-xs"
                >
                  <span>{countryFlag[agent.country ?? ''] ?? '🌍'}</span>
                  <span className="flex-1">{agent.id}</span>
                  <span className="text-fg-secondary uppercase">{agent.country}</span>
                  {agent.id === activeAgentId && <Check className="w-3.5 h-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Schedule Side Menu */}
          <ScheduleSideMenu transparentHeader={transparentHeader && !isScrolled} />

          {/* User Menu */}
          <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "h-9 w-9 p-0 rounded-full transition-all duration-500 hover:scale-105",
                  transparentHeader && !isScrolled 
                    ? "bg-white/15 hover:bg-white/25" 
                    : "hover:bg-muted/60"
                )}
              >
                <UserAvatar name="Nino Bouchedid" image={profileImage} size="sm" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-hidden p-0" hideDefaultClose>
              <div className="relative h-full w-full">
              <AnimatePresence initial={false}>
              {!showPersonalDetails && !showLanguagePanel ? (
                <motion.div 
                  key="main-menu"
                  initial={animationDirection === 'back' ? { x: '-100%', opacity: 0 } : false}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.32, 0.72, 0, 1]
                  }}
                  className="absolute inset-0 flex flex-col overflow-hidden bg-background px-6"
                  style={{ willChange: 'transform, opacity' }}
                >
                  {/* Header row with X button */}
                  <div className="pt-6 mb-4">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setProfileSheetOpen(false)}
                      className="h-10 w-10 rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <SheetHeader className="text-left space-y-4 shrink-0">
                    <div className="flex flex-col items-center gap-4">
                      {/* Profile picture with edit button */}
                      <div className="relative">
                        <UserAvatar name="Nino Bouchedid" image={profileImage} className="w-[92px] h-[92px] text-2xl" />
                        <button
                          onClick={() => setProfilePictureModalOpen(true)}
                          className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors ring-2 ring-background border-2 border-background"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-center">
                        <SheetTitle className="text-2xl">Nino Bouchedid</SheetTitle>
                        <p className="text-sm text-muted-foreground mt-1">Madrid, Spain</p>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="mt-8 space-y-3 flex-1 overflow-y-auto">
                    {/* Work Section */}
                    <div className="bg-card rounded-xl overflow-hidden">
                      <button 
                        onClick={() => window.open('https://drive.google.com/drive/mobile/folders/1c06PjY1iA_oTOmoVXhjdCQEijiRouEHa?pli=1', '_blank')}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{t('profile.workDocuments')}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Personal Section */}
                    <div className="bg-card rounded-xl overflow-hidden">
                      <button 
                        onClick={() => {
                          setAnimationDirection('forward');
                          setShowPersonalDetails(true);
                        }}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{t('profile.personalDetails')}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Language Section */}
                    <div className="bg-card rounded-xl overflow-hidden">
                      <button 
                        onClick={() => {
                          setAnimationDirection('forward');
                          setShowLanguagePanel(true);
                        }}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{t('profile.language')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{language === 'es' ? 'Español' : 'English'}</span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </button>
                    </div>

                    {/* Support Section */}
                    <div className="bg-card rounded-xl overflow-hidden">
                      <button 
                        onClick={() => window.open('https://huspy.atlassian.net/servicedesk/customer/portal/273/user/login?destination=portal%2F273', '_blank')}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <HelpCircle className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{t('profile.support')}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>

                      <button 
                        onClick={() => window.open('https://www.huspy.es/politica-de-privacidad', '_blank')}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{t('profile.privacyPolicy')}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Log Out */}
                    <button 
                      onClick={() => {
                        setProfileSheetOpen(false);
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-3 p-4 hover:bg-destructive/10 rounded-xl transition-colors text-left text-destructive"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">{t('profile.logOut')}</span>
                    </button>
                  </div>
                </motion.div>
              ) : showPersonalDetails ? (
              <motion.div 
                key="personal-details" 
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.32, 0.72, 0, 1]
                }}
                className="absolute inset-0 flex flex-col overflow-hidden bg-background px-6"
                style={{ willChange: 'transform, opacity' }}
              >
                  {/* Header */}
                  <div className="flex items-center gap-4 pb-6 pt-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setAnimationDirection('back');
                        setShowPersonalDetails(false);
                      }}
                      className="h-9 w-9 shrink-0 rounded-xl hover:bg-muted"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <SheetTitle className="text-2xl font-semibold leading-heading text-foreground">{t('profile.personalDetails')}</SheetTitle>
                  </div>

                  {/* Content - slide animation */}
                  <div className="flex-1 overflow-y-auto pb-6 space-y-3">
                    {/* Name */}
                    <div className="bg-card rounded-xl p-4 space-y-1">
                      <h3 className="text-lg font-semibold leading-heading text-foreground">{t('profile.name')}</h3>
                      <p className="text-sm font-normal leading-body text-muted-foreground">Pedro Torres</p>
                    </div>

                    {/* Location */}
                    <div className="bg-card rounded-xl p-4 space-y-1">
                      <h3 className="text-lg font-semibold leading-heading text-foreground">{t('profile.location')}</h3>
                      <p className="text-sm font-normal leading-body text-muted-foreground">Madrid, Spain</p>
                    </div>

                    {/* Phone Number */}
                    <div className="bg-card rounded-xl p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold leading-heading text-foreground">{t('profile.phoneNumber')}</h3>
                        <p className="text-sm font-normal leading-body text-muted-foreground">{phoneNumber}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPhoneModalOpen(true)}
                        className="text-muted-foreground shrink-0 h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Email Address */}
                    <div className="bg-card rounded-xl p-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold leading-heading text-foreground">{t('profile.emailAddress')}</h3>
                        <p className="text-sm font-normal leading-body text-muted-foreground">{email}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="language-panel"
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.32, 0.72, 0, 1]
                  }}
                  className="absolute inset-0 flex flex-col overflow-hidden bg-background px-6"
                  style={{ willChange: 'transform, opacity' }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-4 pb-6 pt-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setAnimationDirection('back');
                        setShowLanguagePanel(false);
                      }}
                      className="h-9 w-9 shrink-0 rounded-xl hover:bg-muted"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <SheetTitle className="text-2xl font-semibold leading-heading text-foreground">{t('language.title')}</SheetTitle>
                  </div>

                  {/* Language options */}
                  <div className="flex-1 overflow-y-auto pb-6 space-y-3">
                    <div className="bg-card rounded-xl overflow-hidden">
                      <button
                        onClick={() => { setLanguage('en'); setAnimationDirection('back'); setShowLanguagePanel(false); }}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="font-medium">{t('language.english')}</span>
                        {language === 'en' && <Check className="w-5 h-5 text-foreground" />}
                      </button>
                      <button
                        onClick={() => { setLanguage('es'); setAnimationDirection('back'); setShowLanguagePanel(false); }}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="font-medium">{t('language.spanish')}</span>
                        {language === 'es' && <Check className="w-5 h-5 text-foreground" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      
      <NewClientModal open={newClientModalOpen} onOpenChange={setNewClientModalOpen} />
      <NewOpportunityModal open={newOpportunityModalOpen} onOpenChange={setNewOpportunityModalOpen} />
      <NewTaskModal open={newTaskModalOpen} onOpenChange={setNewTaskModalOpen} />
      <NewDocumentModal open={newDocumentModalOpen} onOpenChange={setNewDocumentModalOpen} />
      <EditPhoneModal
        open={phoneModalOpen}
        onOpenChange={setPhoneModalOpen}
        onPhoneUpdated={(newPhone) => {
          setPhoneNumber(newPhone);
        }}
      />
      <EditEmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        onEmailUpdated={(newEmail) => {
          setEmail(newEmail);
        }}
      />
      <EditProfilePictureModal
        open={profilePictureModalOpen}
        onOpenChange={setProfilePictureModalOpen}
        currentImage={profileImage}
        onImageUpdated={(newImage) => {
          setProfileImage(newImage);
        }}
        startInEditMode
      />
    </>
  );
}