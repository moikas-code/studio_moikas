export interface Template_text_element {
  text: string;
  x: number;
  y: number;
  font_size: number;
  color: string;
  font_family: string;
  font_weight: string;
  rotation: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  width: number;
  height: number;
  background_color: string;
  background_gradient?: {
    start: string;
    end: string;
    direction: 'horizontal' | 'vertical' | 'diagonal';
  };
  text_elements: Template_text_element[];
  thumbnail?: string; // Base64 preview image
}

export const template_categories = [
  { id: 'youtube', name: 'YouTube', icon: '🎬' },
  { id: 'social', name: 'Social Media', icon: '📱' },
  { id: 'marketing', name: 'Marketing', icon: '📈' },
  { id: 'memes', name: 'Memes', icon: '😂' },
  { id: 'avatars', name: 'Avatars', icon: '👤' },
  { id: 'banners', name: 'Banners', icon: '🎯' },
];

export const templates: Template[] = [
  // YouTube Templates
  {
    id: 'youtube-thumbnail-1',
    name: 'YouTube Thumbnail - Bold',
    description: 'Eye-catching thumbnail with large title text',
    category: 'youtube',
    width: 1280,
    height: 720,
    background_color: '#ff4444',
    background_gradient: {
      start: '#ff4444',
      end: '#cc0000',
      direction: 'diagonal'
    },
    text_elements: [
      {
        text: 'YOUR TITLE HERE',
        x: 640,
        y: 360,
        font_size: 72,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: 'SUBSCRIBE!',
        x: 1100,
        y: 620,
        font_size: 36,
        color: '#ffff00',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: -10,
      },
    ],
  },
  {
    id: 'youtube-thumbnail-2',
    name: 'YouTube Thumbnail - Clean',
    description: 'Clean and professional thumbnail design',
    category: 'youtube',
    width: 1280,
    height: 720,
    background_color: '#2563eb',
    background_gradient: {
      start: '#2563eb',
      end: '#1d4ed8',
      direction: 'vertical'
    },
    text_elements: [
      {
        text: 'Tutorial',
        x: 640,
        y: 200,
        font_size: 48,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'normal',
        rotation: 0,
      },
      {
        text: 'MAIN TITLE',
        x: 640,
        y: 360,
        font_size: 64,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: 'Step by step guide',
        x: 640,
        y: 520,
        font_size: 32,
        color: '#e5e7eb',
        font_family: 'Arial',
        font_weight: 'normal',
        rotation: 0,
      },
    ],
  },
  {
    id: 'youtube-shorts-1',
    name: 'YouTube Shorts - Vertical',
    description: 'Optimized for YouTube Shorts and TikTok',
    category: 'youtube',
    width: 1080,
    height: 1920,
    background_color: '#8b5cf6',
    background_gradient: {
      start: '#8b5cf6',
      end: '#7c3aed',
      direction: 'vertical'
    },
    text_elements: [
      {
        text: 'SHORTS',
        x: 540,
        y: 300,
        font_size: 80,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: 'Main Topic',
        x: 540,
        y: 960,
        font_size: 64,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: 'Swipe up for more!',
        x: 540,
        y: 1600,
        font_size: 36,
        color: '#fbbf24',
        font_family: 'Arial',
        font_weight: 'normal',
        rotation: 0,
      },
    ],
  },

  // Social Media Templates
  {
    id: 'instagram-post-1',
    name: 'Instagram Post - Square',
    description: 'Perfect square format for Instagram posts',
    category: 'social',
    width: 1080,
    height: 1080,
    background_color: '#f59e0b',
    background_gradient: {
      start: '#f59e0b',
      end: '#d97706',
      direction: 'diagonal'
    },
    text_elements: [
      {
        text: 'YOUR POST',
        x: 540,
        y: 540,
        font_size: 72,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: '#hashtag',
        x: 540,
        y: 900,
        font_size: 32,
        color: '#fef3c7',
        font_family: 'Arial',
        font_weight: 'normal',
        rotation: 0,
      },
    ],
  },
  {
    id: 'twitter-banner-1',
    name: 'Twitter/X Banner',
    description: 'Header banner for Twitter/X profiles',
    category: 'social',
    width: 1500,
    height: 500,
    background_color: '#1f2937',
    background_gradient: {
      start: '#1f2937',
      end: '#111827',
      direction: 'horizontal'
    },
    text_elements: [
      {
        text: 'Your Name',
        x: 750,
        y: 200,
        font_size: 64,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: 'Professional Title | Expert in Field',
        x: 750,
        y: 300,
        font_size: 32,
        color: '#9ca3af',
        font_family: 'Arial',
        font_weight: 'normal',
        rotation: 0,
      },
    ],
  },

  // Marketing Templates
  {
    id: 'web-banner-1',
    name: 'Web Banner - Leaderboard',
    description: 'Standard web advertising banner',
    category: 'marketing',
    width: 728,
    height: 90,
    background_color: '#10b981',
    text_elements: [
      {
        text: 'Special Offer!',
        x: 200,
        y: 45,
        font_size: 28,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: 'Click Here',
        x: 600,
        y: 45,
        font_size: 24,
        color: '#fbbf24',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
    ],
  },
  {
    id: 'facebook-ad-1',
    name: 'Facebook Ad - Square',
    description: 'Square format for Facebook advertising',
    category: 'marketing',
    width: 1200,
    height: 1200,
    background_color: '#3b82f6',
    background_gradient: {
      start: '#3b82f6',
      end: '#1d4ed8',
      direction: 'diagonal'
    },
    text_elements: [
      {
        text: 'LIMITED TIME',
        x: 600,
        y: 300,
        font_size: 48,
        color: '#fbbf24',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: '50% OFF',
        x: 600,
        y: 600,
        font_size: 96,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: 'Shop Now',
        x: 600,
        y: 900,
        font_size: 36,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'normal',
        rotation: 0,
      },
    ],
  },

  // Meme Templates
  {
    id: 'meme-classic-1',
    name: 'Classic Meme - Top/Bottom',
    description: 'Traditional meme format with top and bottom text',
    category: 'memes',
    width: 800,
    height: 600,
    background_color: '#ffffff',
    text_elements: [
      {
        text: 'TOP TEXT',
        x: 400,
        y: 80,
        font_size: 48,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: 'BOTTOM TEXT',
        x: 400,
        y: 520,
        font_size: 48,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
    ],
  },
  {
    id: 'meme-modern-1',
    name: 'Modern Meme - Center',
    description: 'Modern meme style with centered text',
    category: 'memes',
    width: 1080,
    height: 1080,
    background_color: '#1f2937',
    text_elements: [
      {
        text: 'When you',
        x: 540,
        y: 300,
        font_size: 44,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'normal',
        rotation: 0,
      },
      {
        text: 'MEME TEXT HERE',
        x: 540,
        y: 540,
        font_size: 64,
        color: '#fbbf24',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: 'Relatable moment',
        x: 540,
        y: 780,
        font_size: 36,
        color: '#9ca3af',
        font_family: 'Arial',
        font_weight: 'normal',
        rotation: 0,
      },
    ],
  },

  // Avatar Templates
  {
    id: 'avatar-circle-1',
    name: 'Avatar - Circle',
    description: 'Circular avatar with initial',
    category: 'avatars',
    width: 400,
    height: 400,
    background_color: '#6366f1',
    background_gradient: {
      start: '#6366f1',
      end: '#4f46e5',
      direction: 'diagonal'
    },
    text_elements: [
      {
        text: 'A',
        x: 200,
        y: 200,
        font_size: 180,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
    ],
  },
  {
    id: 'avatar-square-1',
    name: 'Avatar - Square',
    description: 'Square avatar with initials',
    category: 'avatars',
    width: 400,
    height: 400,
    background_color: '#dc2626',
    text_elements: [
      {
        text: 'AB',
        x: 200,
        y: 200,
        font_size: 120,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
    ],
  },

  // Banner Templates
  {
    id: 'banner-event-1',
    name: 'Event Banner',
    description: 'Banner for events and announcements',
    category: 'banners',
    width: 1200,
    height: 400,
    background_color: '#7c3aed',
    background_gradient: {
      start: '#7c3aed',
      end: '#5b21b6',
      direction: 'horizontal'
    },
    text_elements: [
      {
        text: 'EVENT NAME',
        x: 600,
        y: 150,
        font_size: 64,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: 'Date & Location',
        x: 600,
        y: 250,
        font_size: 32,
        color: '#e5e7eb',
        font_family: 'Arial',
        font_weight: 'normal',
        rotation: 0,
      },
      {
        text: 'Register Now!',
        x: 600,
        y: 320,
        font_size: 28,
        color: '#fbbf24',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
    ],
  },
  {
    id: 'banner-sale-1',
    name: 'Sale Banner',
    description: 'Promotional banner for sales',
    category: 'banners',
    width: 1000,
    height: 300,
    background_color: '#dc2626',
    background_gradient: {
      start: '#dc2626',
      end: '#991b1b',
      direction: 'diagonal'
    },
    text_elements: [
      {
        text: 'MEGA SALE',
        x: 500,
        y: 120,
        font_size: 72,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: 'Up to 70% OFF',
        x: 500,
        y: 200,
        font_size: 36,
        color: '#fbbf24',
        font_family: 'Arial',
        font_weight: 'bold',
        rotation: 0,
      },
      {
        text: 'Limited Time Only',
        x: 500,
        y: 250,
        font_size: 24,
        color: '#ffffff',
        font_family: 'Arial',
        font_weight: 'normal',
        rotation: 0,
      },
    ],
  },
];

// Helper function to get templates by category
export function get_templates_by_category(category: string): Template[] {
  return templates.filter(template => template.category === category);
}

// Helper function to get all categories with template counts
export function get_categories_with_counts() {
  return template_categories.map(category => ({
    ...category,
    count: get_templates_by_category(category.id).length,
  }));
}

// Helper function to create canvas background from template
export function create_template_background(template: Template): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  canvas.width = template.width;
  canvas.height = template.height;

  if (template.background_gradient) {
    const gradient = ctx.createLinearGradient(
      template.background_gradient.direction === 'horizontal' ? 0 : 
      template.background_gradient.direction === 'diagonal' ? 0 : 
      template.width / 2,
      template.background_gradient.direction === 'vertical' ? 0 : 
      template.background_gradient.direction === 'diagonal' ? 0 : 
      template.height / 2,
      template.background_gradient.direction === 'horizontal' ? template.width : 
      template.background_gradient.direction === 'diagonal' ? template.width : 
      template.width / 2,
      template.background_gradient.direction === 'vertical' ? template.height : 
      template.background_gradient.direction === 'diagonal' ? template.height : 
      template.height / 2
    );
    gradient.addColorStop(0, template.background_gradient.start);
    gradient.addColorStop(1, template.background_gradient.end);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = template.background_color;
  }

  ctx.fillRect(0, 0, template.width, template.height);

  return canvas.toDataURL().split(',')[1]; // Return base64 without prefix
} 