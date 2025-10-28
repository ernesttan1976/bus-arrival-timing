import Tracker from '@openreplay/tracker/lib/app';

// Only initialize tracker in production environment
const initializeTracker = () => {
  if (import.meta.env.VITE_OPENREPLAY_PROJECT_KEY && import.meta.env.VITE_OPENREPLAY_INGEST_POINT) {
    return new Tracker({
      projectKey: import.meta.env.VITE_OPENREPLAY_PROJECT_KEY,
      ingestPoint: import.meta.env.VITE_OPENREPLAY_INGEST_POINT,
    });
  }
  return null;
};

const tracker = initializeTracker();

export default tracker;