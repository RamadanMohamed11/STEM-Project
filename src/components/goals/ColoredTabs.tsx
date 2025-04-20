import { useState, createContext, useContext, ReactNode } from 'react';

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

type ColoredTabsProps = {
  defaultValue: string;
  children: ReactNode;
  className?: string;
};

export function ColoredTabs({ defaultValue, children, className = "" }: ColoredTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

type ColoredTabsListProps = {
  children: ReactNode;
  className?: string;
};

export function ColoredTabsList({ children, className = "" }: ColoredTabsListProps) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-lg p-1 gap-2 bg-slate-100 shadow-inner ${className}`}
      role="tablist"
    >
      {children}
    </div>
  );
}

type ColoredTabsTriggerProps = {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  color: 'red' | 'yellow' | 'green';
};

export function ColoredTabsTrigger({
  value,
  children,
  className = "",
  disabled = false,
  color
}: ColoredTabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  // Inline styles for guaranteed color application with more distinct active/inactive states
  const colorStyles: Record<string, React.CSSProperties> = {
    red: { 
      backgroundColor: isActive ? '#dc2626' : '#fecaca', 
      color: isActive ? '#fff' : '#b91c1c',
      fontWeight: isActive ? 600 : 400,
      borderBottom: isActive ? '2px solid #b91c1c' : 'none'
    },
    yellow: { 
      backgroundColor: isActive ? '#ca8a04' : '#fef3c7', 
      color: isActive ? '#fff' : '#854d0e',
      fontWeight: isActive ? 600 : 400,
      borderBottom: isActive ? '2px solid #854d0e' : 'none'
    },
    green: { 
      backgroundColor: isActive ? '#16a34a' : '#dcfce7', 
      color: isActive ? '#fff' : '#166534',
      fontWeight: isActive ? 600 : 400,
      borderBottom: isActive ? '2px solid #166534' : 'none'
    }
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      style={colorStyles[color]}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 hover:opacity-90 ${isActive ? 'shadow-md' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

type ColoredTabsContentProps = {
  value: string;
  children: ReactNode;
  className?: string;
  color: 'red' | 'yellow' | 'green';
};

export function ColoredTabsContent({
  value,
  children,
  className = "",
  color
}: ColoredTabsContentProps) {
  const { activeTab } = useTabs();
  const isActive = activeTab === value;

  if (!isActive) return null;

  // Define color classes for content
  const colorClasses = {
    red: 'bg-red-100 border-red-200',
    yellow: 'bg-yellow-100 border-yellow-200',
    green: 'bg-green-100 border-green-200'
  };

  return (
    <div
      role="tabpanel"
      data-state={isActive ? "active" : "inactive"}
      className={`mt-2 p-4 rounded-md border ${colorClasses[color]} ${className}`}
    >
      {children}
    </div>
  );
}
