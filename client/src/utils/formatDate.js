import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const timeAgo = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
};

export const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'yyyy.MM.dd', { locale: ko });
};