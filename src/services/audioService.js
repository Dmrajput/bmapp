// Minimal audio service placeholder
// In a real app this would use expo-av or react-native-sound

const audioService = {
  play: async (track) => {
    // stub: start playback
    console.log('play', track?.title || track);
    return Promise.resolve(true);
  },
  pause: () => {
    console.log('pause');
  },
  stop: () => {
    console.log('stop');
  },
};

export default audioService;
