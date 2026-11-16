'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import NFTModal from '@/components/game/NFTModal';
import { determineNFTRarity } from '@/lib/services/game-engine';
import { GAME } from '@/lib/constants/game';
import { formatNumber } from '@/lib/utils/formatNumber';
import styles from './gallery.module.css';

type RarityFilter = 'all' | 'common' | 'epic' | 'legendary' | 'art';
type LayoutOption = 'grid3' | 'grid2' | 'grid4' | 'list' | 'listDetail';

const LAYOUT_ICONS: { key: LayoutOption; title: string; d: string }[] = [
  { key: 'grid3', title: 'Grid 3', d: 'M1,1h4v4H1zM6,1h4v4H6zM11,1h4v4h-4zM1,6h4v4H1zM6,6h4v4H6zM11,6h4v4h-4zM1,11h4v4H1zM6,11h4v4H6zM11,11h4v4h-4z' },
  { key: 'grid2', title: 'Grid 2', d: 'M1,1h6v6H1zM9,1h6v6H9zM1,9h6v6H1zM9,9h6v6H9z' },
  { key: 'grid4', title: 'Grid 4', d: 'M1,1h3v5H1zM5,1h3v5H5zM9,1h3v5H9zM13,1h3v5h-3zM1,8h3v5H1zM5,8h3v5H5zM9,8h3v5H9zM13,8h3v5h-3z' },
  { key: 'list', title: 'List', d: 'M5,2h10v2H5zM1,2h3v2H1zM5,7h10v2H5zM1,7h3v2H1zM5,12h10v2H5zM1,12h3v2H1z' },
  { key: 'listDetail', title: 'List Detail', d: 'M1,1h14v4H1zM1,6h14v4H1zM1,11h14v4H1z' },
];

export default function Gallery() {
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [selectedFilters, setSelectedFilters] = useState<Map<string, Set<string>>>(new Map());
  const [expandedTraits, setExpandedTraits] = useState<Set<string>>(new Set());
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [layout, setLayout] = useState<LayoutOption>('grid3');
  const itemsPerPage = 25;

  useEffect(() => { loadAllNFTs(); }, []);

  const loadAllNFTs = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/nft/collection?fetchAll=true');
      if (!r.ok) { setNfts([]); return; }
      const d = await r.json();
      setNfts(d.nfts || []);
    } catch (e) { console.error('Error loading gallery:', e); setNfts([]); }
    finally { setLoading(false); }
  };

  const traitGroups = useMemo(() => {
    const groupMap = new Map<string, Map<string, number>>();
    nfts.forEach(nft => {
      const attrs = nft.metadata?.attributes || [];
      attrs.forEach((attr: any) => {
        if (!attr.trait_type || !attr.value) return;
        if (!groupMap.has(attr.trait_type)) groupMap.set(attr.trait_type, new Map());
        const valMap = groupMap.get(attr.trait_type)!;
        valMap.set(String(attr.value), (valMap.get(String(attr.value)) || 0) + 1);
      });
    });
    return Array.from(groupMap.entries())
      .map(([traitType, valMap]) => ({
        traitType,
        values: Array.from(valMap.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => a.traitType.localeCompare(b.traitType));
  }, [nfts]);

  const toggleFilter = useCallback((traitType: string, value: string) => {
    setSelectedFilters(prev => {
      const next = new Map(prev);
      const values = new Set(next.get(traitType) || []);
      if (values.has(value)) values.delete(value); else values.add(value);
      if (values.size === 0) next.delete(traitType); else next.set(traitType, values);
      return next;
    });
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => { setSelectedFilters(new Map()); setCurrentPage(1); }, []);

  const toggleTraitExpand = useCallback((traitType: string) => {
    setExpandedTraits(prev => { const next = new Set(prev); if (next.has(traitType)) next.delete(traitType); else next.add(traitType); return next; });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    selectedFilters.forEach(values => { count += values.size; });
    return count;
  }, [selectedFilters]);

  const getRarityColor = (rarity: string) => {
    const r = rarity?.toLowerCase();
    if (r === 'legendary') return 'var(--accent-yellow)';
    if (r === 'epic') return '#b44dff';
    if (r === 'art' || r === '1/1') return 'var(--accent-magenta, #ff2d95)';
    return 'var(--text-secondary)';
  };

  const getRarityLabel = (rarity: string) => {
    const r = rarity?.toLowerCase();
    if (r === 'art' || r === '1/1') return '1/1 ART';
    if (r === 'legendary') return 'Legendary';
    if (r === 'epic') return 'Epic';
    return 'Common';
  };

  const shortenAddr = (a: string) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';

  const enrichedNFTs = useMemo(() => nfts.map(nft => ({
    ...nft,
    rarity: nft.rarity || determineNFTRarity(nft.tokenId, nft.metadata?.attributes),
  })), [nfts]);

  const filteredNFTs = useMemo(() => {
    let result = enrichedNFTs;
    if (rarityFilter !== 'all') {
      result = result.filter(nft => {
        const r = nft.rarity?.toLowerCase();
        if (rarityFilter === 'art') return r === 'art' || r === '1/1';
        return r === rarityFilter;
      });
    }
    if (selectedFilters.size > 0) {
      result = result.filter(nft => {
        const attrs = nft.metadata?.attributes || [];
        return Array.from(selectedFilters.entries()).every(([traitType, values]) =>
          attrs.some((attr: any) => attr.trait_type === traitType && values.has(attr.value))
        );
      });
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(nft => (nft.tokenId?.toString().toLowerCase() || '').includes(q) || (nft.metadata?.name?.toLowerCase() || '').includes(q));
    }
    return result;
  }, [enrichedNFTs, rarityFilter, selectedFilters, searchTerm]);

  const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);
  const currentNFTs = filteredNFTs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, rarityFilter]);

  const goToPage = (page: number) => setCurrentPage(page);

  const getGridClass = () => {
    const map: Record<LayoutOption, string> = { grid3: styles.grid3, grid2: styles.grid2, grid4: styles.grid4, list: styles.list, listDetail: styles.listDetail };
    return `${styles.nftGrid} ${map[layout] || styles.grid3}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <h1>GALLERY</h1>
          <p>Browse the full Punkers collection. {formatNumber(GAME.totalNFTs)} unique characters.</p>
        </div>

        {/* Rarity Filter Tabs + showing count */}
        <div className={styles.filterTabsRow}>
          <div className={styles.filterTabs}>
            {(['all', 'common', 'epic', 'legendary', 'art'] as RarityFilter[]).map(f => {
              const count = f === 'all' ? enrichedNFTs.length : enrichedNFTs.filter(n => {
                const r = n.rarity?.toLowerCase();
                if (f === 'art') return r === 'art' || r === '1/1';
                return r === f;
              }).length;
              const label = f === 'all' ? 'All' : f === 'art' ? '1/1 ART' : f.charAt(0).toUpperCase() + f.slice(1);
              return (
                <button key={f} className={`${styles.filterTab} ${rarityFilter === f ? styles.active : ''}`} onClick={() => setRarityFilter(f)}>
                  {label} ({count})
                </button>
              );
            })}
          </div>
          <div className={styles.showingCount}>{filteredNFTs.length > 0 ? `showing ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredNFTs.length)} of ${filteredNFTs.length} punkers` : 'no punkers found'}</div>
        </div>

      {/* Search + Layout switcher + Filter toggle */}
      <div className={styles.toolbar}>
        <button className={`${styles.filterToggle} ${showFilters ? styles.active : ''}`} onClick={() => setShowFilters(!showFilters)} aria-label="Toggle filters">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>
          {activeFilterCount > 0 && <span className={styles.badge}>{activeFilterCount}</span>}
        </button>
        <input className={styles.search} type="text" placeholder="Search Punker #..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        {activeFilterCount > 0 && <button className={styles.clearBtn} onClick={clearFilters}>✕ Clear</button>}
        <div className={styles.layoutBtns}>
          {LAYOUT_ICONS.map(l => (
            <button key={l.key} className={`${styles.layoutBtn} ${layout === l.key ? styles.active : ''}`} title={l.title} onClick={() => setLayout(l.key)}>
              <svg viewBox="0 0 16 16"><path d={l.d} /></svg>
            </button>
          ))}
        </div>
      </div>

      {/* Active filter tags */}
      {activeFilterCount > 0 && (
        <div className={styles.activeTags}>
          {Array.from(selectedFilters.entries()).map(([traitType, values]) =>
            Array.from(values).map(value => (
              <button key={`${traitType}:${value}`} className={styles.tag} onClick={() => toggleFilter(traitType, value)}>
                {traitType}: {value} ✕
              </button>
            ))
          )}
        </div>
      )}

      {/* Main content: Sidebar + Grid */}
      <div className={`${styles.mainContent} ${showFilters ? styles.withSidebar : ''}`}>
        {/* Left Sidebar Filter Panel */}
        {showFilters && (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <span>Traits</span>
              {activeFilterCount > 0 && <button className={styles.clearBtn} onClick={clearFilters}>Clear all</button>}
            </div>
            <div className={styles.sidebarFilters}>
              {traitGroups.map(group => {
                const isExpanded = expandedTraits.has(group.traitType);
                const selectedValues = selectedFilters.get(group.traitType);
                const hasActive = selectedValues && selectedValues.size > 0;
                const activeCount = selectedValues?.size || 0;
                return (
                  <div key={group.traitType} className={styles.traitGroup}>
                    <button className={styles.traitHeader} onClick={() => toggleTraitExpand(group.traitType)} type="button">
                      <span className={styles.traitHeaderLeft}>
                        <svg className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`} viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M4.94 5.72a.75.75 0 0 1 1.06 0L8 7.78l2-.06a.75.75 0 1 1 1.06 1.06l-3.53 3.53-3.53-3.53a.75.75 0 0 1 0-1.06z"/></svg>
                        <span className={styles.traitName}>{group.traitType}</span>
                      </span>
                      <span className={styles.traitHeaderRight}>
                        {hasActive && <span className={styles.traitActiveBadge}>{activeCount}</span>}
                        <span className={styles.traitCount}>{group.values.length}</span>
                      </span>
                    </button>
                    {isExpanded && (
                      <div className={styles.traitValues}>
                        {group.values.map(v => {
                          const isSelected = selectedValues?.has(v.value) || false;
                          const pct = nfts.length > 0 ? Math.round((v.count / nfts.length) * 100) : 0;
                          return (
                            <button key={v.value} className={`${styles.traitRow} ${isSelected ? styles.traitRowActive : ''}`} onClick={() => toggleFilter(group.traitType, v.value)}>
                              <span className={styles.traitCheckbox}>
                                {isSelected && <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>}
                              </span>
                              <span className={styles.traitRowLabel}>{v.value}</span>
                              <span className={styles.traitRowMeta}>
                                <span className={styles.traitRowCount}>{v.count}</span>
                                <span className={styles.traitRowPct}>{pct}%</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Right: Grid content */}
        <div className={styles.gridContent}>
          {loading ? (
            <div className={styles.empty}><div className={styles.emptyIcon}>⏳</div><p>Loading gallery...</p></div>
          ) : filteredNFTs.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🖼️</div>
              <p>No NFTs match your filters</p>
              {activeFilterCount > 0 && <button className={styles.clearBtn} onClick={clearFilters}>Clear filters</button>}
            </div>
          ) : (<>
            <div className={getGridClass()}>
              {currentNFTs.map(nft => {
                const isDead = nft.isDead || nft.metadata?.status === 'RIP';
                const rarity = nft.rarity || 'Common';
                const owner = nft.owner || nft.metadata?.owner || '';

                return (
                  <div key={nft.tokenId} className={styles.card} onClick={() => { setSelectedNFT(nft); setIsModalOpen(true); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedNFT(nft); setIsModalOpen(true); } }}>
                    <div className={styles.cardImg} style={isDead ? { filter: 'grayscale(1) brightness(0.5)' } : { padding: 0, background: '#111' }}>
                      {nft.metadata?.image
                        ? <img src={nft.metadata.image} alt={nft.metadata?.name || `#${nft.tokenId}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : (isDead ? '💀' : '🎭')
                      }
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardName}>{nft.metadata?.name || `Punker #${nft.tokenId}`}</div>
                      <div className={styles.cardOwner}>{shortenAddr(owner)}</div>
                      <div className={styles.cardRarity} style={{ color: getRarityColor(rarity) }}>{getRarityLabel(rarity)}</div>
                      <div className={styles.cardStatus}>
                        <span className={`${styles.statusBadge} ${isDead ? styles.rip : styles.alive}`}>
                          {isDead ? '🪦 RIP' : '✓ ALIVE'}
                        </span>
                      </div>
                      <div className={styles.cardExtra}>
                        <div className={styles.cardStat}><span className={styles.statLabel}>Earn</span><span className={styles.statVal}>{nft.estimatedPoints ?? 10} $PUNK/day</span></div>
                        <div className={styles.cardStat}><span className={styles.statLabel}>Staked</span><span className={styles.statVal}>{nft.stakedAt ? `Day ${Math.max(1, Math.floor((Date.now() - new Date(nft.stakedAt).getTime()) / 86400000))}` : 'Unstaked'}</span></div>
                        <div className={styles.cardStat}><span className={styles.statLabel}>Owner</span><span className={styles.statValMuted}>{shortenAddr(owner)}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return <button key={page} className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`} onClick={() => goToPage(page)}>{page}</button>;
                  }
                  if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className={styles.dots}>...</span>;
                  return null;
                })}
                <button className={styles.pageBtn} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next →</button>
              </div>
            )}
          </>)}
        </div>
      </div>
      </div>

      <NFTModal nft={selectedNFT} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedNFT(null); }} />
    </div>
  );
}
