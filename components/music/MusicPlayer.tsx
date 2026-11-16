'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './MusicPlayer.module.css';

interface Track {
  title: string;
  artist: string;
  sc: string;
}

const TRACKS: Track[] = [
  { title: 'Conundrum', artist: 'The Sigit', sc: 'https://soundcloud.com/thesigit/conundrum' },
];

export default function MusicPlayer() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [trackName, setTrackName] = useState('—');
  const [mounted, setMounted] = useState(false);

  // Use refs for mutable state that callbacks need without stale closures
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<any>(null);
  const scReadyRef = useRef(false);
  const currentIdxRef = useRef(-1);
  const playingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { setMounted(true); }, []);

  // Load SoundCloud Widget API script once
  useEffect(() => {
    if (document.getElementById('sc-widget-api')) return;
    const script = document.createElement('script');
    script.id = 'sc-widget-api';
    script.src = 'https://w.soundcloud.com/player/api.js';
    document.head.appendChild(script);
  }, []);

  /** Bind SC widget events on the current iframe */
  function bindWidget() {
    const iframe = iframeRef.current;
    const SC = (globalThis as any).SC;
    if (!iframe || !SC) return;

    const widget = SC.Widget(iframe);
    widgetRef.current = widget;
    scReadyRef.current = false;

    widget.bind(SC.Widget.Events.READY, () => {
      scReadyRef.current = true;
    });
    widget.bind(SC.Widget.Events.PLAY, () => {
      setPlaying(true);
      widget.getCurrentSound((sound: any) => {
        if (sound?.title) setTrackName(sound.title);
      });
    });
    widget.bind(SC.Widget.Events.PAUSE, () => {
      setPlaying(false);
    });
    widget.bind(SC.Widget.Events.FINISH, () => {
      // Use ref to avoid stale closure
      const nextIdx = (currentIdxRef.current + 1) % TRACKS.length;
      loadAndPlay(nextIdx);
    });
  }

  /** Load a track into the iframe and autoplay */
  function loadAndPlay(idx: number) {
    const t = TRACKS[idx];
    if (!t) return;

    setCurrentIdx(idx);
    setTrackName(t.title);
    setPlaying(true);

    const iframe = iframeRef.current;
    if (!iframe) return;

    // Set new src with auto_play=true
    iframe.src =
      'https://w.soundcloud.com/player/?url=' +
      encodeURIComponent(t.sc) +
      '&color=%23e53030&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false';

    // Re-bind widget after iframe loads new src
    scReadyRef.current = false;
    widgetRef.current = null;
    iframe.onload = () => bindWidget();
  }

  function togglePlay() {
    if (currentIdxRef.current < 0) {
      loadAndPlay(0);
      return;
    }
    const widget = widgetRef.current;
    if (widget && scReadyRef.current) {
      if (playingRef.current) {
        widget.pause();
      } else {
        widget.play();
      }
    }
  }

  function playNext() {
    const nextIdx = currentIdxRef.current < 0 ? 0 : (currentIdxRef.current + 1) % TRACKS.length;
    loadAndPlay(nextIdx);
  }

  function playPrev() {
    const prevIdx = currentIdxRef.current <= 0 ? TRACKS.length - 1 : currentIdxRef.current - 1;
    loadAndPlay(prevIdx);
  }

  function handleTogglePanel() {
    const willOpen = !panelOpen;
    setPanelOpen(willOpen);
    
    if (willOpen) {
      // When opening, start minimized
      setMinimized(true);
      if (currentIdxRef.current < 0) {
        setTimeout(() => loadAndPlay(0), 100);
      }
    }
    
    window.dispatchEvent(new CustomEvent('punkers-music-toggle', { detail: { open: willOpen } }));
  }

  function handleClose() {
    setPanelOpen(false);
    window.dispatchEvent(new CustomEvent('punkers-music-toggle', { detail: { open: false } }));
  }

  function toggleMinimize() {
    setMinimized((prev) => !prev);
  }

  /** Callback ref for iframe — bind widget when iframe mounts */
  function setIframeRef(el: HTMLIFrameElement | null) {
    iframeRef.current = el;
    if (el) {
      // If SC API already loaded, bind immediately
      const SC = (globalThis as any).SC;
      if (SC) {
        bindWidget();
      } else {
        // Wait for SC API to load
        const check = setInterval(() => {
          if ((globalThis as any).SC) {
            clearInterval(check);
            bindWidget();
          }
        }, 200);
        // Cleanup after 10s
        setTimeout(() => clearInterval(check), 10000);
      }
    }
  }

  return (
    <>
      {/* Navbar button */}
      <button
        className={styles.navBtn}
        onClick={handleTogglePanel}
        title="PUNKERS PLAYLIST"
        aria-label="Toggle music player"
        style={panelOpen ? { borderColor: 'var(--accent-red)' } : undefined}
      >
        🎸
      </button>

      {/* Portal: panel + iframe rendered at body so position:fixed works */}
      {mounted && createPortal(
        <>
          {/* Floating panel */}
          {panelOpen && (
            <div className={`${styles.panel} ${minimized ? styles.minimized : ''}`}>
              <button
                className={styles.panelHeader}
                onClick={toggleMinimize}
                type="button"
              >
                <span className={styles.panelTitle}>🎸 PUNKERS PLAYLIST</span>
                <div className={styles.panelControls} onClick={(e) => e.stopPropagation()}>
                  <button onClick={toggleMinimize} type="button" title={minimized ? 'Expand' : 'Minimize'}>
                    {minimized ? '▲' : '▼'}
                  </button>
                  <button onClick={handleClose} type="button" title="Close">✕</button>
                </div>
              </button>
              {!minimized && (
                <div className={styles.panelBody}>
                  <div className={styles.nowPlaying}>
                    {'NOW PLAYING: '}<span>{trackName}</span>
                  </div>
                  <div className={styles.controls}>
                    <button className={styles.mpBtn} onClick={playPrev}>⏮</button>
                    <button className={`${styles.mpBtn} ${styles.active}`} onClick={togglePlay}>
                      {playing ? '⏸' : '▶'}
                    </button>
                    <button className={styles.mpBtn} onClick={playNext}>⏭</button>
                  </div>
                  <div className={styles.playlist}>
                    {TRACKS.map((t, i) => (
                      <button
                        key={t.sc}
                        className={`${styles.track} ${i === currentIdx ? styles.trackActive : ''}`}
                        onClick={() => loadAndPlay(i)}
                      >
                        <span className={styles.trackNum}>{i === currentIdx ? '♪' : i + 1}</span>
                        <span className={styles.trackName}>{t.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hidden SoundCloud iframe — always mounted so ref is stable */}
          <iframe
            ref={setIframeRef}
            width="0"
            height="0"
            allow="autoplay"
            title="SoundCloud Player"
            style={{ position: 'absolute', pointerEvents: 'none', opacity: 0, width: '1px', height: '1px', border: 'none' }}
            src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/thesigit/conundrum&color=%23e53030&auto_play=false&hide_related=true&show_comments=false"
          />
        </>,
        document.body
      )}
    </>
  );
}
