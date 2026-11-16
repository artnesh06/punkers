'use client';

import { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import styles from './LinkifyText.module.css';

const URL_REGEX = /(https?:\/\/[^\s<>"']+|(?:www\.)[^\s<>"']+)/g;

interface LinkifyTextProps {
  readonly text: string;
  readonly className?: string;
}

function splitWithUrls(text: string): { value: string; isUrl: boolean }[] {
  const result: { value: string; isUrl: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(URL_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ value: text.slice(lastIndex, match.index), isUrl: false });
    }
    result.push({ value: match[0], isUrl: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push({ value: text.slice(lastIndex), isUrl: false });
  }

  return result;
}

export default function LinkifyText({ text, className }: LinkifyTextProps) {
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const parts = useMemo(() => splitWithUrls(text), [text]);

  const handleLinkClick = useCallback((e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    setPendingUrl(fullUrl);
  }, []);

  const confirmOpen = useCallback(() => {
    if (pendingUrl) {
      window.open(pendingUrl, '_blank', 'noopener,noreferrer');
    }
    setPendingUrl(null);
  }, [pendingUrl]);

  const cancelOpen = useCallback(() => {
    setPendingUrl(null);
  }, []);

  return (
    <>
      <span className={className}>
        {parts.map((part) =>
          part.isUrl ? (
            <button
              key={part.value}
              type="button"
              className={styles.adLink}
              onClick={(e) => handleLinkClick(e, part.value)}
              title={part.value}
            >
              {part.value}
            </button>
          ) : (
            part.value
          )
        )}
      </span>

      {pendingUrl && createPortal(
        <div
          className={styles.confirmOverlay}
          onClick={cancelOpen}
          onKeyDown={(e) => { if (e.key === 'Escape') cancelOpen(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="link-confirm-title"
          tabIndex={-1}
        >
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>⚠️</div>
            <div className={styles.confirmTitle} id="link-confirm-title">
              Leaving Punkers
            </div>
            <p className={styles.confirmDesc}>
              You are about to visit an external link. This content is not
              controlled or verified by Punkers. Be cautious of phishing
              attempts, scams, or malicious websites.
            </p>
            <div className={styles.confirmUrl}>{pendingUrl}</div>
            <p className={styles.confirmWarn}>
              Do you wish to continue?
            </p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.cancelBtn} onClick={cancelOpen}>
                Go Back
              </button>
              <button type="button" className={styles.proceedBtn} onClick={confirmOpen}>
                Continue →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
