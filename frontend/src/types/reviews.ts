export interface ReviewAspect {
  name: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface Review {
  id: string;
  text: string;
  source: string;
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  products: string[];
  aspects: ReviewAspect[];
  internalTags: string[];
  author: string;
  verified: boolean;
}