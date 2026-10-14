import { useEffect, useState } from 'react';
import { companyInfo, problems as seed, roadmapTopics } from '../../server/data.js';
import { api } from './api.js';
import { catalogFrom } from './catalog.js';

// Start from the bundled data so the app works instantly (and offline), then upgrade from the API.
export function useCatalog() {
  const [catalog, setCatalog] = useState(() => catalogFrom(seed, companyInfo, roadmapTopics));
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .catalog(controller.signal)
      .then(data => {
        if (Array.isArray(data.problems) && data.problems.length) {
          setCatalog(catalogFrom(data.problems, data.companies || companyInfo, data.topics || roadmapTopics));
        }
        setOnline(true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return { catalog, online };
}
