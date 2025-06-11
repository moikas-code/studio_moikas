// Simple test script to verify Fast-SDXL API format
// Run with: node test-fast-sdxl.js

const test_payloads = [
  {
    name: "Minimal payload",
    payload: {
      prompt: "1 anime girl on beach in a bikini, 8k",
      image_size: {
        width: 1024,
        height: 1024
      }
    }
  },
  {
    name: "With negative prompt",
    payload: {
      prompt: "1 anime girl on beach in a bikini, 8k",
      negative_prompt: "cartoon, illustration, animation. face. male, female",
      image_size: {
        width: 1024,
        height: 1024
      }
    }
  },
  {
    name: "With all parameters except LoRAs",
    payload: {
      prompt: "1 anime girl on beach in a bikini, 8k",
      negative_prompt: "cartoon, illustration, animation. face. male, female",
      image_size: {
        width: 1024,
        height: 1024
      },
      guidance_scale: 7.5,
      num_inference_steps: 28,
      num_images: 1,
      enable_safety_checker: false,
      expand_prompt: true,
      format: "jpeg"
    }
  },
  {
    name: "With empty LoRAs array",
    payload: {
      prompt: "1 anime girl on beach in a bikini, 8k",
      negative_prompt: "cartoon, illustration, animation. face. male, female",
      image_size: {
        width: 1024,
        height: 1024
      },
      guidance_scale: 7.5,
      num_inference_steps: 28,
      num_images: 1,
      enable_safety_checker: false,
      expand_prompt: true,
      format: "jpeg",
      loras: []
    }
  },
  {
    name: "With invalid LoRAs (should fail)",
    payload: {
      prompt: "1 anime girl on beach in a bikini, 8k",
      image_size: {
        width: 1024,
        height: 1024
      },
      loras: [null, undefined, {}, { scale: 1 }] // All invalid
    }
  }
];

// Print each test payload
test_payloads.forEach(test => {
  console.log(`\n=== ${test.name} ===`);
  console.log(JSON.stringify(test.payload, null, 2));
});

console.log('\n\nTo test these payloads:');
console.log('1. Use the /api/test/fast-sdxl endpoint');
console.log('2. Or test directly with the fal.ai API');
console.log('\nThe issue is likely with invalid LoRA objects in the array.');