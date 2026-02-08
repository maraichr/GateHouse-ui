import { useState, ReactNode, Children, isValidElement, cloneElement } from 'react';
import { Icon } from '../../utils/icons';
import { cn } from '../../utils/cn';

interface TabLayoutProps {
  children?: ReactNode;
}

interface TabProps {
  id?: string;
  label?: string;
  icon?: string;
  active?: boolean;
  children?: ReactNode;
}

export function TabLayout({ children }: TabLayoutProps) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = Children.toArray(children).filter(isValidElement) as React.ReactElement<TabProps>[];

  return (
    <div>
      <div className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <nav className="flex gap-0 px-6" role="tablist">
          {tabs.map((tab, i) => (
            <button
              key={tab.props.id || i}
              role="tab"
              aria-selected={i === activeTab}
              onClick={() => setActiveTab(i)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              style={i === activeTab
                ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }
                : { borderColor: 'transparent', color: 'var(--color-text-muted)' }
              }
            >
              {tab.props.icon && <Icon name={tab.props.icon} className="h-4 w-4" />}
              {tab.props.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-6">
        {tabs[activeTab] && cloneElement(tabs[activeTab], { active: true })}
      </div>
    </div>
  );
}

export function Tab({ children, active }: TabProps) {
  if (!active) return null;
  return <div>{children}</div>;
}
