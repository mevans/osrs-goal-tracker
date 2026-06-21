import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { searchItems, getItemName, type ItemInfo } from '../engine/item-db';
import { ItemIcon } from './ItemIcon';

interface ItemPickerProps {
  itemId: string;
  onChange: (itemId: string) => void;
  autoFocus?: boolean;
}

export function ItemPicker({ itemId, onChange, autoFocus = false }: ItemPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownRect, setDropdownRect] = useState<
    { top: number; left: number; width: number } | undefined
  >(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => searchItems(query), [query]);
  const selectedName = itemId ? getItemName(itemId) : '';

  const close = () => {
    setOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
  };

  const pick = (item: ItemInfo) => {
    onChange(item.id);
    close();
  };

  const updateDropdownRect = () => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;

    updateDropdownRect();
    window.addEventListener('resize', updateDropdownRect);
    window.addEventListener('scroll', updateDropdownRect, true);
    return () => {
      window.removeEventListener('resize', updateDropdownRect);
      window.removeEventListener('scroll', updateDropdownRect, true);
    };
  }, [open, query, results.length]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      close();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [open]);

  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  const dropdown =
    open && results.length > 0 && dropdownRect
      ? createPortal(
          <ul
            ref={listRef}
            style={{
              position: 'fixed',
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
            }}
            className="bg-surface-700 border border-surface-border rounded shadow-lg z-[60] max-h-60 overflow-y-auto overscroll-contain"
          >
            {results.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(item);
                  }}
                  className={`w-full text-left px-2 py-1.5 flex items-center gap-2 ${
                    index === highlightedIndex
                      ? 'bg-brand text-white'
                      : 'text-stone-200 hover:bg-surface-600'
                  }`}
                >
                  <ItemIcon itemId={item.id} size={20} />
                  <span className="text-sm truncate">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-2">
        {itemId && <ItemIcon itemId={itemId} size={28} />}
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="text"
          name="item-search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
          value={open ? query : selectedName}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          onBlur={close}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIndex((i) => Math.max(i - 1, -1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (highlightedIndex >= 0) {
                const item = results[highlightedIndex];
                if (item) pick(item);
              } else if (results.length === 1 && query.trim()) {
                pick(results[0]!);
              }
            } else if (e.key === 'Escape') {
              close();
            }
          }}
          placeholder="Search items..."
          className="flex-1 bg-surface-700 text-white rounded px-3 py-2 border border-surface-border focus:border-brand focus:outline-none text-sm"
        />
      </div>
      {dropdown}
    </div>
  );
}
