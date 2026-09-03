/**
 * Select — shadcn-shaili ka API (Select/SelectTrigger/SelectValue/SelectContent/SelectItem)
 * par andar se seedha native <select>. Isse M19 ke pages bina badle chalte hain,
 * aur koi bahari dependency (radix) nahi chahiye.
 */
import React from 'react';

export interface SelectItemProps {
  value: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

/** Sirf dhaancha batane ke liye — asli rendering Select karta hai. */
export const SelectItem: React.FC<SelectItemProps> = () => null;
export const SelectContent: React.FC<{ children?: React.ReactNode }> = () => null;
export const SelectValue: React.FC<{ placeholder?: string }> = () => null;
export const SelectTrigger: React.FC<{ className?: string; children?: React.ReactNode }> = () => null;

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type AnyEl = React.ReactElement<Record<string, unknown>>;

const isEl = (n: React.ReactNode, t: unknown): n is AnyEl =>
  React.isValidElement(n) && n.type === t;

/** SelectContent ke andar se saare SelectItem nikal lo (array/nested ko bhi kholte hue). */
const collectItems = (node: React.ReactNode, out: SelectItemProps[]): void => {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      out.push(child.props as SelectItemProps);
    } else {
      const inner = (child.props as { children?: React.ReactNode }).children;
      if (inner) collectItems(inner, out);
    }
  });
};

export const Select: React.FC<SelectProps> = ({
  value, defaultValue, onValueChange, disabled, className, children,
}) => {
  const items: SelectItemProps[] = [];
  let placeholder: string | undefined;
  let triggerClass: string | undefined;

  React.Children.forEach(children, (child) => {
    if (isEl(child, SelectContent)) {
      collectItems((child.props as { children?: React.ReactNode }).children, items);
    } else if (isEl(child, SelectTrigger)) {
      triggerClass = (child.props as { className?: string }).className;
      React.Children.forEach((child.props as { children?: React.ReactNode }).children, (g) => {
        if (isEl(g, SelectValue)) placeholder = (g.props as { placeholder?: string }).placeholder;
      });
    }
  });

  const cls = [
    'h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A]',
    triggerClass, className,
  ].filter(Boolean).join(' ');

  return (
    <select
      className={cls}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      {placeholder !== undefined && items.every((i) => i.value !== '') && (
        <option value="" disabled={value !== undefined && value !== ''}>{placeholder}</option>
      )}
      {items.map((item) => (
        <option key={item.value} value={item.value} disabled={item.disabled}>
          {item.children as React.ReactNode}
        </option>
      ))}
    </select>
  );
};

export default Select;
