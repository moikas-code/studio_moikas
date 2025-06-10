"use client";
import BottomNav from "../../components/BottomNav";
export default function ToolsLayoutClient({ children }: {  children: React.ReactNode }) {
  return <>
    {children}
    <BottomNav />
  </>;
} 