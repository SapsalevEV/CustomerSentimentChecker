import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilters } from "@/contexts/AppDataProvider";
import { Review, ReviewAspect } from "@/types/reviews";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Calendar,
  Shield,
  Tag,
  Plus,
  X,
  MessageCircle,
  Send,
  CheckCircle
} from "lucide-react";

interface ReviewCardProps {
  review: Review;
}

const getSourceLabel = (source: string) => {
  const sourceMap = {
    'app-store': 'App Store',
    'google-play': 'Google Play', 
    'banki-ru': 'Banki.ru',
    'irecommend': 'iRecommend',
    'social-vk': 'ВКонтакте',
    'social-telegram': 'Telegram',
    'reviews-site': 'Сайт отзывов'
  };
  return sourceMap[source as keyof typeof sourceMap] || source;
};

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return <ThumbsUp className="w-4 h-4 text-green-600" />;
    case 'negative':
      return <ThumbsDown className="w-4 h-4 text-red-600" />;
    default:
      return <MessageSquare className="w-4 h-4 text-yellow-600" />;
  }
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'negative':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
};

const getAspectSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return 'bg-green-100 text-green-800';
    case 'negative':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const highlightText = (
  text: string,
  products: string[],
  aspects: { name: string; sentiment: 'positive' | 'negative' | 'neutral' }[],
  availableProducts: Array<{ value: string; label: string; category: string }>
) => {
  let highlightedText = text;

  // Highlight product mentions
  const productNames = products.map(productValue => {
    const product = availableProducts.find(p => p.value === productValue);
    return product?.label;
  }).filter(Boolean);
  
  productNames.forEach(productName => {
    const regex = new RegExp(`(${productName})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark class="bg-blue-100 text-blue-800 px-1 rounded">$1</mark>');
  });
  
  // Highlight aspect mentions
  aspects.forEach(aspect => {
    const regex = new RegExp(`(${aspect.name})`, 'gi');
    const colorClass = aspect.sentiment === 'positive' ? 'bg-green-100 text-green-800' : 
                      aspect.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800';
    highlightedText = highlightedText.replace(regex, `<mark class="${colorClass} px-1 rounded">$1</mark>`);
  });
  
  return highlightedText;
};

const internalTagOptions = [
  'Передано в IT',
  'Кейс для маркетинга', 
  'Требует ответа',
  'Эскалация в руководство',
  'Положительный кейс',
  'Обработано',
  'Требует доработки продукта',
  'Конкурентная разведка'
];

export function ReviewCard({ review }: ReviewCardProps) {
  const { availableProducts } = useFilters();
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [newTag, setNewTag] = useState("");
  const [localTags, setLocalTags] = useState(review.internalTags);

  const highlightedText = highlightText(review.text, review.products, review.aspects, availableProducts);
  
  const addTag = (tag: string) => {
    if (tag && !localTags.includes(tag)) {
      setLocalTags([...localTags, tag]);
      setNewTag("");
    }
  };
  
  const removeTag = (tag: string) => {
    setLocalTags(localTags.filter(t => t !== tag));
  };
  
  const submitComment = () => {
    if (comment.trim()) {
      // Here you would typically send the comment to your backend
      console.log('Comment submitted:', comment);
      setComment("");
      setShowComment(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        {/* Review Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getSentimentIcon(review.sentiment)}
              <Badge className={getSentimentColor(review.sentiment)}>
                {review.sentiment === 'positive' ? 'Позитивный' : 
                 review.sentiment === 'negative' ? 'Негативный' : 'Нейтральный'}
              </Badge>
              <span className="text-sm font-mono text-muted-foreground">
                {Math.round(review.score * 100)}%
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {getSourceLabel(review.source)}
              </Badge>
              {review.verified && (
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">Verified</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(review.date).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="mt-1 font-medium">{review.author}</div>
          </div>
        </div>

        {/* Review Text with Highlighting */}
        <div 
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightedText }}
        />

        {/* Products and Aspects Tags */}
        <div className="space-y-3">
          {/* Products */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium text-muted-foreground">Продукты:</span>
            {review.products.map(productValue => {
              const product = availableProducts.find(p => p.value === productValue);
              return (
                <Badge key={productValue} variant="secondary" className="text-xs">
                  {product?.label}
                </Badge>
              );
            })}
          </div>

          {/* Aspects with Sentiment */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium text-muted-foreground">Аспекты:</span>
            {review.aspects.map((aspect, index) => (
              <Badge 
                key={index} 
                className={`text-xs ${getAspectSentimentColor(aspect.sentiment)}`}
              >
                {aspect.name} → {aspect.sentiment === 'positive' ? '👍' : aspect.sentiment === 'negative' ? '👎' : '😐'}
              </Badge>
            ))}
          </div>
        </div>

        {/* Internal Tags Management */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Внутренние теги:</span>
            </div>
            <Button
              variant="ghost"  
              size="sm"
              onClick={() => setShowComment(!showComment)}
              className="gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Комментарий
            </Button>
          </div>

          {/* Existing Tags */}
          <div className="flex flex-wrap gap-2">
            {localTags.map(tag => (
              <Badge key={tag} variant="outline" className="gap-1">
                {tag}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-600" 
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
            
            {/* Add New Tag */}
            <Select onValueChange={addTag}>
              <SelectTrigger className="w-auto h-6 px-2 text-xs">
                <div className="flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  <span>Добавить тег</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {internalTagOptions
                  .filter(tag => !localTags.includes(tag))
                  .map(tag => (
                    <SelectItem key={tag} value={tag} className="text-xs">
                      {tag}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comment Section */}
          {showComment && (
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <Textarea
                placeholder="Добавить внутренний комментарий..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px] text-sm"
              />
              <div className="flex items-center justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowComment(false)}
                >
                  Отмена
                </Button>
                <Button 
                  size="sm"
                  onClick={submitComment}
                  disabled={!comment.trim()}
                  className="gap-2"
                >
                  <Send className="w-3 h-3" />
                  Сохранить
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
