// Quick test to verify API data flow
import apiService from '../services/apiService';

async function testApiDataFlow() {
  console.log('🧪 Testing API Data Flow...');
  
  try {
    // Test 1: Fetch raw audio
    console.log('\n=== Test 1: fetchAllAudio ===');
    const rawAudio = await apiService.fetchAllAudio();
    console.log('Raw audio count:', rawAudio.length);
    if (rawAudio.length > 0) {
      console.log('First item (raw):', rawAudio[0]);
    }
    
    // Test 2: Fetch formatted audio
    console.log('\n=== Test 2: fetchFormattedAudio ===');
    const formattedAudio = await apiService.fetchFormattedAudio();
    console.log('Formatted audio count:', formattedAudio.length);
    if (formattedAudio.length > 0) {
      console.log('First item (formatted):', formattedAudio[0]);
      console.log('First item URI:', formattedAudio[0].uri);
      console.log('First item ID:', formattedAudio[0].id);
    }
    
    // Test 3: Fetch by category
    console.log('\n=== Test 3: fetchFormattedAudioByCategory ===');
    const categoryAudio = await apiService.fetchFormattedAudioByCategory('General');
    console.log('Category audio count:', categoryAudio.length);
    if (categoryAudio.length > 0) {
      console.log('First category item:', categoryAudio[0]);
    }
    
    console.log('\n✅ API Data Flow Test Complete');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

export default testApiDataFlow;
