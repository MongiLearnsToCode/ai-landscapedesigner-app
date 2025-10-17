import React, { useState, useMemo, useRef, useEffect } from 'react';
import { HistoryCard } from '../components/HistoryCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import type { HistoryItem, LandscapingStyle } from '../types';
import { SlidersHorizontal, Search, Trash2, List, LayoutGrid, ChevronsUpDown, Filter, X } from 'lucide-react';
import { LANDSCAPING_STYLES } from '../constants';
import { useHistory } from '../contexts/HistoryContext';

interface HistoryPageProps {
  historyItems: HistoryItem[];
  onView: (item: HistoryItem) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}

type SortOption = 'default' | 'date-desc' | 'date-asc' | 'name-asc';
type DateFilterOption = 'all' | '7d' | '30d';

export const HistoryPage: React.FC<HistoryPageProps> = ({ historyItems, onView, onPin, onDelete }) => {
  const { deleteMultipleItems } = useHistory();

  const [unpinModalState, setUnpinModalState] = useState({ isOpen: false, itemId: null as string | null });
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false });
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<LandscapingStyle[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let items = [...historyItems];

    if (searchQuery.trim()) {
      const lowercasedQuery = searchQuery.toLowerCase();
      items = items.filter(item => {
        const styleNames = item.styles.map(styleId => LANDSCAPING_STYLES.find(s => s.id === styleId)?.name || '').join(' ').toLowerCase();
        if (styleNames.includes(lowercasedQuery)) return true;
        if (item.climateZone.toLowerCase().includes(lowercasedQuery)) return true;
        if (item.designCatalog.plants.some(p => p.name.toLowerCase().includes(lowercasedQuery) || p.species.toLowerCase().includes(lowercasedQuery))) return true;
        if (item.designCatalog.features.some(f => f.name.toLowerCase().includes(lowercasedQuery) || f.description.toLowerCase().includes(lowercasedQuery))) return true;
        return false;
      });
    }

    if (selectedStyles.length > 0) {
      items = items.filter(item => selectedStyles.every(style => item.styles.includes(style)));
    }

    if (dateFilter !== 'all') {
      const days = dateFilter === '7d' ? 7 : 30;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      items = items.filter(item => item.timestamp >= cutoff);
    }

    const getStyleNames = (item: HistoryItem) => item.styles.map(styleId => LANDSCAPING_STYLES.find(s => s.id === styleId)?.name || styleId).join(' & ');

    switch (sortOption) {
      case 'date-desc': return items.sort((a, b) => b.timestamp - a.timestamp);
      case 'date-asc': return items.sort((a, b) => a.timestamp - b.timestamp);
      case 'name-asc': return items.sort((a, b) => getStyleNames(a).localeCompare(getStyleNames(b)));
      default:
        return items.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return b.timestamp - a.timestamp;
        });
    }
  }, [historyItems, searchQuery, selectedStyles, dateFilter, sortOption]);

  const handleAttemptUnpin = (id: string) => setUnpinModalState({ isOpen: true, itemId: id });
  const handleConfirmUnpin = () => {
    if (unpinModalState.itemId) onPin(unpinModalState.itemId);
    setUnpinModalState({ isOpen: false, itemId: null });
  };
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItemIds([]);
  };
  const handleToggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };
  const handleConfirmDeleteSelected = async () => {
    await deleteMultipleItems(selectedItemIds);
    setDeleteModalState({ isOpen: false });
    setIsSelectionMode(false);
    setSelectedItemIds([]);
  };

  const handleStyleToggle = (styleId: LandscapingStyle) => {
    setSelectedStyles(prev => prev.includes(styleId) ? prev.filter(s => s !== styleId) : [...prev, styleId]);
  };
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStyles([]);
    setDateFilter('all');
  };
  const hasActiveFilters = searchQuery.trim() !== '' || selectedStyles.length > 0 || dateFilter !== 'all';

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="search-projects" className="block text-sm font-medium text-slate-700 mb-1.5">Search</label>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" id="search-projects" placeholder="Keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100/80 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 h-10"/></div>
      </div>
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">Date Created</h4>
        <div className="flex flex-col space-y-2">
          {(['all', '7d', '30d'] as const).map(d => <label key={d} className="flex items-center space-x-2 cursor-pointer text-sm"><input type="radio" name="date-filter" value={d} checked={dateFilter === d} onChange={() => setDateFilter(d)} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300"/><span>{{ all: 'All Time', '7d': 'Last 7 Days', '30d': 'Last 30 Days' }[d]}</span></label>)}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">Styles</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">{LANDSCAPING_STYLES.map(style => <label key={style.id} className="flex items-center space-x-2 cursor-pointer text-sm"><input type="checkbox" checked={selectedStyles.includes(style.id)} onChange={() => handleStyleToggle(style.id)} className="h-4 w-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"/><span>{style.name}</span></label>)}</div>
      </div>
      {hasActiveFilters && <div className="pt-4 border-t border-slate-200/80"><button onClick={resetFilters} className="w-full text-sm text-center font-semibold text-orange-600 hover:underline">Reset all filters</button></div>}
    </div>
  );

  const containerClasses = viewMode === 'list' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6';

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Your Projects</h2>
        <p className="text-slate-500 mt-1">Search, filter, and manage your past designs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-28 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Filter & Sort</h3>
            <FilterPanel />
          </div>
        </aside>

        <main className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3 p-3 bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button onClick={() => setIsFilterPanelOpen(true)} className="lg:hidden p-2 bg-slate-100 rounded-md text-slate-600 hover:bg-slate-200"><Filter className="h-5 w-5" /></button>
              <button onClick={handleToggleSelectionMode} className="h-9 px-4 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0">{isSelectionMode ? 'Cancel' : 'Select'}</button>
              <p className="text-sm text-slate-500 hidden sm:block">{filteredAndSortedItems.length} project{filteredAndSortedItems.length !== 1 && 's'}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative" ref={sortDropdownRef}>
                <button onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)} className="h-9 px-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"><ChevronsUpDown className="h-4 w-4 text-slate-500" /><span>Sort</span></button>
                {isSortDropdownOpen && <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200/80 p-1 z-10">{[{id: 'default', label: 'Default'}, {id: 'date-desc', label: 'Date (Newest)'}, {id: 'date-asc', label: 'Date (Oldest)'}, {id: 'name-asc', label: 'Name (A-Z)'}].map(o => <button key={o.id} onClick={() => { setSortOption(o.id as SortOption); setIsSortDropdownOpen(false); }} className={`w-full text-left px-3 py-2 text-sm rounded-md ${sortOption === o.id ? 'font-semibold text-slate-900 bg-slate-100' : 'text-slate-700 hover:bg-slate-100'}`}>{o.label}</button>)}</div>}
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`} aria-label="List view"><List className="h-4 w-4" /></button>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`} aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          {isSelectionMode && (
            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-800">{selectedItemIds.length} item{selectedItemIds.length !== 1 && 's'} selected</span>
              <button onClick={() => setDeleteModalState({ isOpen: true })} disabled={selectedItemIds.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"><Trash2 className="h-4 w-4" />Delete Selected</button>
            </div>
          )}

          {historyItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200/80"><SlidersHorizontal className="mx-auto h-16 w-16 text-slate-300" strokeWidth={1} /><h3 className="mt-4 text-xl font-medium text-slate-700">No Projects Yet</h3><p className="mt-1 text-sm text-slate-500">Create a new design, and it will show up here!</p></div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200/80"><Search className="mx-auto h-16 w-16 text-slate-300" strokeWidth={1} /><h3 className="mt-4 text-xl font-medium text-slate-700">No Projects Found</h3><p className="mt-1 text-sm text-slate-500">Your search and filter criteria did not match any projects.</p></div>
          ) : (
            <div className={containerClasses}>{filteredAndSortedItems.map(item => <HistoryCard key={item.id} item={item} onView={onView} onPin={onPin} onAttemptUnpin={handleAttemptUnpin} onDelete={onDelete} isSelectionMode={isSelectionMode} isSelected={selectedItemIds.includes(item.id)} onToggleSelection={handleToggleItemSelection} viewMode={viewMode}/>)}</div>
          )}
        </main>
      </div>
      
      <div className={`fixed inset-0 bg-slate-900/40 z-40 lg:hidden transition-opacity duration-300 ${isFilterPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsFilterPanelOpen(false)}>
        <div className={`fixed top-0 left-0 bottom-0 bg-white shadow-lg z-50 w-80 p-6 transition-transform duration-300 ease-in-out ${isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold">Filter & Sort</h3><button onClick={() => setIsFilterPanelOpen(false)} className="p-1 rounded-full hover:bg-slate-100"><X className="h-5 w-5 text-slate-600" /></button></div>
          <FilterPanel />
        </div>
      </div>

      <ConfirmationModal isOpen={unpinModalState.isOpen} onClose={() => setUnpinModalState({ isOpen: false, itemId: null })} onConfirm={handleConfirmUnpin} title="Confirm Unpin" message="Are you sure? Unpinned items are automatically deleted after 7 days." confirmText="Unpin" />
      <ConfirmationModal isOpen={deleteModalState.isOpen} onClose={() => setDeleteModalState({ isOpen: false })} onConfirm={handleConfirmDeleteSelected} title={`Delete ${selectedItemIds.length} Project${selectedItemIds.length > 1 ? 's' : ''}`} message={`Are you sure you want to permanently delete the selected project${selectedItemIds.length > 1 ? 's' : ''}? This action cannot be undone.`} confirmText="Delete" />
    </div>
  );
};
