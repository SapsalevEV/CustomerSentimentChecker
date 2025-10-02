/**
 * Пример использования API клиента
 * Этот файл показывает, как использовать новый API клиент в хуках
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardApi, reviewsApi, intelligenceApi } from './api-services';

// ==================== Примеры использования ====================

/**
 * Пример 1: Загрузка статистики дашборда
 */
export function useDashboardStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['dashboard-stats', startDate, endDate],
    queryFn: () => dashboardApi.getSentimentStats({
      start_date: startDate,
      end_date: endDate,
      filters: {
        source: ['app-store', 'google-play']
      }
    }),
    staleTime: 1000 * 60 * 5, // 5 минут
  });
}

/**
 * Пример 2: Загрузка отзывов с фильтрами
 */
export function useReviews(filters: {
  start_date: string;
  end_date: string;
  sentiment?: string[];
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['reviews', filters],
    queryFn: () => reviewsApi.getReviews(filters),
    keepPreviousData: true, // Для плавной пагинации
  });
}

/**
 * Пример 3: Загрузка кластеров с автоматическим обновлением
 */
export function useSmartClusters(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['smart-clusters', startDate, endDate],
    queryFn: () => intelligenceApi.getSmartClusters({
      start_date: startDate,
      end_date: endDate,
      min_confidence: 70
    }),
    refetchInterval: 1000 * 60 * 15, // Обновлять каждые 15 минут
  });
}

/**
 * Пример 4: Мутация для создания/обновления данных
 * (если в будущем будут POST/PUT эндпоинты для изменения данных)
 */
export function useUpdateReview() {
  return useMutation({
    mutationFn: (data: { id: string; tags: string[] }) => {
      // Пример, если будет эндпоинт для обновления
      return fetch(`${import.meta.env.VITE_API_BASE_URL}/reviews/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: data.tags })
      }).then(res => res.json());
    },
    onSuccess: () => {
      // Инвалидировать кеш после успешного обновления
      // queryClient.invalidateQueries(['reviews']);
    }
  });
}

// ==================== Установка токена аутентификации ====================

import { apiClient } from './api-client';

/**
 * Установить токен аутентификации после логина
 */
export function setAuthToken(token: string) {
  apiClient.setToken(token);
  // Также можно сохранить в localStorage
  localStorage.setItem('auth_token', token);
}

/**
 * Очистить токен при выходе
 */
export function clearAuthToken() {
  apiClient.clearToken();
  localStorage.removeItem('auth_token');
}

/**
 * Восстановить токен при загрузке приложения
 */
export function initializeAuth() {
  const token = localStorage.getItem('auth_token');
  if (token) {
    apiClient.setToken(token);
  }
}

