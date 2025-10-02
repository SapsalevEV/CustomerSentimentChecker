import { useState } from "react";
import { ReviewCard } from "./ReviewCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, SortAsc } from "lucide-react";
import { Review } from "@/types/reviews";

// Mock reviews data
const mockReviews: Review[] = [
  {
    id: '1',
    text: 'Отличная кредитная карта! Кешбэк действительно работает как заявлено, поддержка отвечает быстро и по делу. Единственное что расстраивает - иногда мобильное приложение зависает при входе, особенно в утренние часы.',
    source: 'banki-ru',
    date: '2024-01-20T10:30:00Z',
    sentiment: 'positive' as const,
    score: 0.72,
    products: ['credit-cards'],
    aspects: [
      { name: 'Кешбэк/бонусы', sentiment: 'positive' as const },
      { name: 'Служба поддержки', sentiment: 'positive' as const },
      { name: 'Мобильное приложение', sentiment: 'negative' as const }
    ],
    internalTags: ['review-processed'],
    author: 'Анна К.',
    verified: true
  },
  {
    id: '2', 
    text: 'Очень долго оформляли документы, требуют кучу лишних справок. Процентная ставка завышена по сравнению с другими банками. В отделении персонал работает медленно, очереди большие.',
    source: 'irecommend',
    date: '2024-01-19T14:15:00Z', 
    sentiment: 'negative' as const,
    score: 0.18,
    products: ['consumer-loan'],
    aspects: [
      { name: 'Документооборот', sentiment: 'negative' as const },
      { name: 'Процентная ставка', sentiment: 'negative' as const },
      { name: 'Скорость обслуживания', sentiment: 'negative' as const }
    ],
    internalTags: [],
    author: 'Михаил В.',
    verified: false
  },
  {
    id: '3',
    text: 'В целом нормальная карта, пользуюсь уже больше года. Приложение удобное и понятное, но бывают редкие сбои при оплате в магазинах. Техподдержка решает вопросы достаточно быстро.',
    source: 'app-store',
    date: '2024-01-18T09:45:00Z',
    sentiment: 'neutral' as const, 
    score: 0.58,
    products: ['debit-cards'],
    aspects: [
      { name: 'Мобильное приложение', sentiment: 'positive' as const },
      { name: 'Удобство использования', sentiment: 'positive' as const },
      { name: 'Служба поддержки', sentiment: 'positive' as const }
    ],
    internalTags: ['needs-followup'],
    author: 'Елена Т.',
    verified: true
  },
  {
    id: '4',
    text: 'Кошмарная поддержка! Уже две недели не могут решить проблему с заблокированной картой. Звоню каждый день, обещают перезвонить - никто не звонит. Никому не рекомендую этот банк!',
    source: 'social-vk',
    date: '2024-01-17T16:20:00Z',
    sentiment: 'negative' as const,
    score: 0.08,
    products: ['debit-cards'],
    aspects: [
      { name: 'Служба поддержки', sentiment: 'negative' as const }
    ],
    internalTags: ['urgent', 'escalated'],
    author: 'Дмитрий Р.',
    verified: false
  },
  {
    id: '5',
    text: 'Очень довольна банком! Быстрое оформление ипотеки, хорошие процентные условия. Менеджер всё подробно объяснил, помог с документами. Мобильное приложение работает стабильно, платежи проходят мгновенно.',
    source: 'google-play',
    date: '2024-01-16T11:30:00Z',
    sentiment: 'positive' as const,
    score: 0.89,
    products: ['mortgage'],
    aspects: [
      { name: 'Скорость обслуживания', sentiment: 'positive' as const },
      { name: 'Условия обслуживания', sentiment: 'positive' as const },
      { name: 'Мобильное приложение', sentiment: 'positive' as const },
      { name: 'Служба поддержки', sentiment: 'positive' as const }
    ],
    internalTags: ['positive-case-study'],
    author: 'Ольга С.',
    verified: true
  },
  {
    id: '6',
    text: 'Накопительный счет с неплохим процентом, но есть нюансы. Деньги поступают не сразу, иногда задержка до 3 дней. Интерфейс интернет-банка устарел, неудобно пользоваться с телефона.',
    source: 'banki-ru',
    date: '2024-01-15T13:45:00Z',
    sentiment: 'neutral' as const,
    score: 0.45,
    products: ['savings'],
    aspects: [
      { name: 'Процентная ставка', sentiment: 'positive' as const },
      { name: 'Скорость обслуживания', sentiment: 'negative' as const },
      { name: 'Online-banking', sentiment: 'negative' as const }
    ],
    internalTags: [],
    author: 'Александр П.',
    verified: true
  }
];

const sortOptions = [
  { value: 'date-desc', label: 'Сначала новые' },
  { value: 'date-asc', label: 'Сначала старые' },
  { value: 'sentiment-desc', label: 'Сначала позитивные' },
  { value: 'sentiment-asc', label: 'Сначала негативные' },
  { value: 'score-desc', label: 'По убыванию оценки' },
  { value: 'score-asc', label: 'По возрастанию оценки' }
];

export function ReviewsFeed() {
  const [reviews] = useState(mockReviews);
  const [sortBy, setSortBy] = useState('date-desc');
  const [displayLimit, setDisplayLimit] = useState(10);

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'sentiment-desc':
        return b.score - a.score;
      case 'sentiment-asc':
        return a.score - b.score;
      case 'score-desc':
        return b.score - a.score;
      case 'score-asc':
        return a.score - b.score;
      default:
        return 0;
    }
  });

  const displayedReviews = sortedReviews.slice(0, displayLimit);

  const loadMore = () => {
    setDisplayLimit(prev => prev + 10);
  };

  return (
    <div className="space-y-4">
      {/* Header with sorting */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Лента отзывов ({reviews.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {displayedReviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Load More Button */}
      {displayLimit < reviews.length && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={loadMore}
            className="gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            Загрузить еще ({reviews.length - displayLimit} осталось)
          </Button>
        </div>
      )}

      {/* No more reviews message */}
      {displayLimit >= reviews.length && reviews.length > 10 && (
        <div className="text-center py-8 text-muted-foreground">
          Все отзывы загружены
        </div>
      )}
    </div>
  );
}