import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from "react";

interface PageTitleContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
  pageTitleContent: ReactNode | null;
  setPageTitleContent: (content: ReactNode | null) => void;
  isTitleVisible: boolean;
  setTitleVisible: (visible: boolean) => void;
  registerTitleElement: (element: HTMLElement | null) => void;
  transparentHeader: boolean;
  setTransparentHeader: (transparent: boolean) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitle] = useState("");
  const [pageTitleContent, setPageTitleContent] = useState<ReactNode | null>(null);
  // Start with title NOT visible in header - will be updated by IntersectionObserver
  // When isTitleVisible is false, the header shows the title (inverted logic)
  const [isTitleVisible, setTitleVisible] = useState(true);
  const [observedElement, setObservedElement] = useState<HTMLElement | null>(null);
  const [transparentHeader, setTransparentHeader] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const registerTitleElement = useCallback((element: HTMLElement | null) => {
    setObservedElement(element);
  }, []);

  // Memoize setters to prevent unnecessary re-renders
  const memoizedSetPageTitle = useCallback((title: string) => setPageTitle(title), []);
  const memoizedSetPageTitleContent = useCallback((content: ReactNode | null) => setPageTitleContent(content), []);
  const memoizedSetTitleVisible = useCallback((visible: boolean) => setTitleVisible(visible), []);
  const memoizedSetTransparentHeader = useCallback((transparent: boolean) => setTransparentHeader(transparent), []);

  // Use IntersectionObserver to track title visibility
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!observedElement) {
      setTitleVisible(true);
      return;
    }
    
    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setTitleVisible(entry.isIntersecting);
          });
        },
        {
          threshold: 0,
          rootMargin: "-64px 0px 0px 0px", // Account for fixed header height
        }
      );

      observerRef.current.observe(observedElement);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [observedElement, pageTitle]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    pageTitle,
    setPageTitle: memoizedSetPageTitle,
    pageTitleContent,
    setPageTitleContent: memoizedSetPageTitleContent,
    isTitleVisible,
    setTitleVisible: memoizedSetTitleVisible,
    registerTitleElement,
    transparentHeader,
    setTransparentHeader: memoizedSetTransparentHeader,
  }), [
    pageTitle, 
    memoizedSetPageTitle, 
    pageTitleContent, 
    memoizedSetPageTitleContent, 
    isTitleVisible, 
    memoizedSetTitleVisible, 
    registerTitleElement, 
    transparentHeader, 
    memoizedSetTransparentHeader
  ]);

  return (
    <PageTitleContext.Provider value={contextValue}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  const context = useContext(PageTitleContext);
  if (context === undefined) {
    throw new Error("usePageTitle must be used within a PageTitleProvider");
  }
  return context;
}

// Hook to register a page title with the context
export function useRegisterPageTitle(title: string, content?: ReactNode) {
  const { setPageTitle, setPageTitleContent, registerTitleElement } = usePageTitle();
  
  const contentRef = useRef<ReactNode>(content);
  contentRef.current = content;
  
  const setRef = useCallback((element: HTMLDivElement | null) => {
    registerTitleElement(element);
  }, [registerTitleElement]);

  useEffect(() => {
    setPageTitle(title);
    setPageTitleContent(contentRef.current || null);
    
    return () => {
      setPageTitle("");
      setPageTitleContent(null);
    };
  }, [title, setPageTitle, setPageTitleContent]);

  useEffect(() => {
    setPageTitleContent(content || null);
  }, [content, setPageTitleContent]);

  return setRef;
}
