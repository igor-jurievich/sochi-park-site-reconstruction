export type QuizQuestionKey = 'purpose' | 'rooms' | 'finish' | 'promo';

export type QuizOption = { label: string; value: string };

export type QuizQuestion = {
  key: QuizQuestionKey;
  title: string;
  image: string;
  options: QuizOption[];
};

export const quizQuestions: Record<QuizQuestionKey, QuizQuestion> = {
  purpose: {
    key: 'purpose',
    title: 'Смотрите подходящую подборку квартир у моря',
    image: '/images/quiz-purpose.webp',
    options: [
      { label: 'Для жизни', value: 'Жить на море' },
      { label: 'Для отдыха', value: 'Отдыхать' },
      { label: 'Перепродать', value: 'Перепродать' },
      { label: 'Сдавать', value: 'Сдавать в аренду' },
    ],
  },
  rooms: {
    key: 'rooms',
    title: 'Выберите количество комнат в Вашей подборке',
    image: '/images/quiz-rooms.webp',
    options: [
      { label: 'Студия', value: 'Студия' },
      { label: '1-комнатная', value: 'Однокомнатная' },
      { label: '2-комнатная', value: 'Двухкомнатная' },
      { label: 'Посмотрю все варианты', value: 'Все варианты' },
    ],
  },
  finish: {
    key: 'finish',
    title: 'Выберите тип отделки в Вашей подборке',
    image: '/images/quiz-finish.webp',
    options: [
      { label: 'Ремонт', value: 'Ремонт' },
      { label: 'Чистовая', value: 'Чистовая' },
      { label: 'Черновая', value: 'Черновая' },
      { label: 'Посмотрю все варианты', value: 'Все варианты' },
    ],
  },
  promo: {
    key: 'promo',
    title: 'Какую акцию включить в Вашу подборку?',
    image: '/images/quiz-promo.webp',
    options: [
      { label: 'Платёж от 20 000 ₽ в месяц', value: 'от 20 000 ₽/мес' },
      { label: 'Без первого взноса', value: 'Без первого взноса' },
      { label: 'Скидка до 20% за наличный расчёт', value: 'Скидка 20%' },
      { label: 'Посмотрю все варианты', value: 'Все варианты' },
    ],
  },
};

export const messengerOptions = [
  { label: 'WhatsApp', value: 'whatsapp', icon: '/icons/whatsapp.svg' },
  { label: 'Telegram', value: 'telegram', icon: '/icons/telegram.svg' },
  { label: 'Max', value: 'max', icon: '/icons/max.svg' },
] as const;
