import { useState, useEffect } from 'react';
import api from '../utils/api';

/**
 * Fetches website content and returns a section-keyed map.
 * 
 * Usage:
 *   const { content, loading } = useWebsiteContent();
 *   // content.vision, content.mission, content.programs, etc.
 */
export function useWebsiteContent() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/website-content/public/')
      .then(r => {
        if (cancelled) return;
        const map = {};
        const data = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
        data.forEach(item => { map[item.section] = item; });
        setContent(map);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { content, loading };
}
