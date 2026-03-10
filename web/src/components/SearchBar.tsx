import { Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Buscar...' }: SearchBarProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
      >
        Buscar
      </button>
    </form>
  );
}
