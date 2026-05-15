"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <Input
        type="search"
        placeholder="Search tools, workflows, training..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 pl-10 bg-white shadow-sm"
      />
    </div>
  );
}
