import { useState, createContext, useContext, ReactNode } from "react";

type TabsContextType = {
  activeTab: string;
  setActiveTab: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

type TabsProps = {
  defaultValue: string;
  children: ReactNode;
  className?: string;
};

export function Tabs({ defaultValue, children, className = "" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

type TabsListProps = {
  children: ReactNode;
  className?: string;
};

export function TabsList({ children, className = "" }: TabsListProps) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md p-1 ${className}`}
      role="tablist"
    >
      {children}
    </div>
  );
}

type TabsTriggerProps = {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'red' | 'yellow' | 'green' | 'default';
};

export function TabsTrigger({
  value,
  children,
  className = "",
  disabled = false,
  variant = "default",
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  // Determine background color based on variant
  let variantClasses = "";
  if (variant === "red") {
    variantClasses = "bg-red-500 text-white hover:bg-red-600 data-[state=active]:bg-red-600";
  } else if (variant === "yellow") {
    variantClasses = "bg-yellow-500 text-white hover:bg-yellow-600 data-[state=active]:bg-yellow-600";
  } else if (variant === "green") {
    variantClasses = "bg-green-500 text-white hover:bg-green-600 data-[state=active]:bg-green-600";
  } else {
    variantClasses = isActive ? "bg-white text-slate-950 shadow-sm" : "";
  }

  return (
    <button
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
}

type TabsContentProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

export function TabsContent({
  value,
  children,
  className = "",
}: TabsContentProps) {
  const { activeTab } = useTabs();
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      data-state={isActive ? "active" : "inactive"}
      className={`mt-2 ${className}`}
    >
      {children}
    </div>
  );
}
