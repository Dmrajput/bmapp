// Minimal download helper placeholder
export default async function downloadTrack(track) {
  console.log('downloading', track?.title || track);
  // stub: pretend we downloaded and return a local path
  return Promise.resolve({ success: true, path: '/local/path/' + (track?.id || 'unknown') });
}
