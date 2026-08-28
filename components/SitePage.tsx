'use client';

/* eslint-disable @next/next/no-img-element -- inline local SVGs match the audited source dimensions */

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { QuizModal } from './QuizModal';

const heroPhrases = ['Море от 1 минуты', 'С ремонтом и без', 'Школа и сад во дворе', 'Сдавай от 70 000 ₽/мес'];

function BlueButton({ children = 'СМОТРЕТЬ ЦЕНЫ КВАРТИР', onClick }: { children?: React.ReactNode; onClick: () => void }) {
  return <button type="button" className="blue-button section-cta" onClick={onClick}>{children}</button>;
}

function ApartmentCard({ image, alt, promo, title, onOpen }: { image: string; alt: string; promo: string; title: string; onOpen: () => void }) {
  return <article className="apartment-card"><div className="apartment-image"><Image src={image} alt={alt} width={548} height={548} /><div className="badges"><span>Скидка до 20 000 ₽/ м²</span><span>Прибыль в год до 30%</span></div></div><div className="apartment-copy"><p>💬 {promo}</p><h3>{title}</h3><small>Виды на море / море и горы / горы</small><BlueButton onClick={onOpen} /></div></article>;
}

function PaymentCard({ title, subtitle, value, suffix, bullets, onOpen }: { title: string; subtitle: string; value: string; suffix: string; bullets: string[]; onOpen: () => void }) {
  return <article className="payment-card"><h3>{title}</h3><p>{subtitle}</p><div className="payment-value"><sup>{value.startsWith('-') ? '' : 'от'}</sup>{value}<small>{suffix}</small></div><ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul><BlueButton onClick={onOpen} /></article>;
}

export default function SitePage() {
  const [quizOpen, setQuizOpen] = useState(false);
  const [initialPurpose, setInitialPurpose] = useState<string | undefined>();
  const [quizSuccessPath, setQuizSuccessPath] = useState('/spasibo.html?region=eu');
  const [quizTrigger, setQuizTrigger] = useState('Квиз');
  const quizOpenedRef = useRef(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typedPhrase, setTypedPhrase] = useState('');

  useEffect(() => {
    document.documentElement.dataset.appReady = 'true';
    const quizTimer = window.setTimeout(() => {
      if (quizOpenedRef.current) return;
      quizOpenedRef.current = true;
      setInitialPurpose(undefined);
      setQuizSuccessPath('/spasibo2.html?region=eu');
      setQuizTrigger('Автооткрытие через 17 секунд');
      setQuizOpen(true);
    }, 17000);
    return () => { delete document.documentElement.dataset.appReady; window.clearTimeout(quizTimer); };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const reducedMotionTimer = window.setTimeout(() => setTypedPhrase(heroPhrases[0]), 0);
      return () => window.clearTimeout(reducedMotionTimer);
    }

    let active = true;
    let currentPhrase = 0;
    let character = 0;
    let deleting = false;
    let timer = 0;

    const typeNextCharacter = () => {
      if (!active) return;
      const phrase = heroPhrases[currentPhrase];

      if (!deleting) {
        character += 1;
        setPhraseIndex(currentPhrase);
        setTypedPhrase(phrase.slice(0, character));
        if (character >= phrase.length) {
          deleting = true;
          timer = window.setTimeout(typeNextCharacter, 1800);
        } else {
          timer = window.setTimeout(typeNextCharacter, 65);
        }
        return;
      }

      character -= 1;
      setTypedPhrase(phrase.slice(0, Math.max(0, character)));
      if (character <= 0) {
        deleting = false;
        currentPhrase = (currentPhrase + 1) % heroPhrases.length;
        setPhraseIndex(currentPhrase);
        timer = window.setTimeout(typeNextCharacter, 260);
      } else {
        timer = window.setTimeout(typeNextCharacter, 34);
      }
    };

    timer = window.setTimeout(typeNextCharacter, 260);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!videoOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setVideoOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [videoOpen]);

  const openQuiz = (purpose?: string, trigger = 'Квиз') => { quizOpenedRef.current = true; setInitialPurpose(purpose); setQuizSuccessPath('/spasibo.html?region=eu'); setQuizTrigger(trigger); setQuizOpen(true); };

  return <>
    <main>
      <section className="hero" id="header">
        <header className="hero-header"><Image src="/logos/oop-logo-on-dark.svg" alt="Объединённый отдел продаж" width={2970} height={2645} priority /></header>
        <div className="hero-inner"><h1>Смотрите подборки<br />квартир у моря</h1><p className="hero-rotator" aria-label={heroPhrases[phraseIndex]}><span className="hero-typed" aria-hidden="true">{typedPhrase}</span><span className="hero-cursor" aria-hidden="true">|</span></p><div className="hero-finance"><div><span>ИПОТЕКА ОТ</span><strong>20 000 ₽/мес.</strong></div><div><span>ПЕРВЫЙ ВЗНОС ОТ</span><strong>0 ₽</strong></div></div><div className="purpose-card" aria-label="Выберите цель покупки"><div className="purpose-grid"><button type="button" onClick={() => openQuiz('Жить на море', 'Первый экран / Для жизни')}>Жить</button><button type="button" onClick={() => openQuiz('Отдыхать', 'Первый экран / Для отдыха')}>Отдыхать</button><button type="button" onClick={() => openQuiz('Перепродать', 'Первый экран / Перепродать')}>Перепродать</button><button type="button" onClick={() => openQuiz('Сдавать в аренду', 'Первый экран / Сдавать')}>Сдавать</button></div><p><img src="/icons/clock.svg" alt="" /><strong>1 минута</strong></p></div><div className="trust-row" aria-label="Рейтинги и партнёры"><span><Image src="/logos/logo-yandex.webp" alt="Яндекс" width={56} height={56} />4,9</span><span><Image src="/logos/logo-2gis.webp" alt="2ГИС" width={56} height={56} />4,7</span><span>Платиновый<br />партнёр</span><Image src="/logos/logo-sber.webp" alt="Сбер" width={56} height={56} /><Image src="/logos/logo-alfa.webp" alt="Альфа-Банк" width={56} height={56} /><Image src="/logos/logo-sovcom.webp" alt="Совкомбанк" width={56} height={56} /></div></div>
      </section>

      <section className="prices-section" id="pricesAndAssortment"><div className="content"><h2>Цены и ассортимент</h2><div className="apartment-grid"><ApartmentCard image="/images/flat-studio.webp" alt="Студия 16-24 м² в ЖК Сочи Парк" promo="Ипотека от 0,8% | Рассрочка от 0%" title="Студии 16-24 м²" onOpen={() => openQuiz(undefined, 'Цены / Студии 16–24 м²')} /><ApartmentCard image="/images/flat-one-room.webp" alt="Однокомнатная квартира 37-45 м² в ЖК Сочи Парк" promo="Рассрочка от 0% до 3 лет" title="1-ком. 37-45 м²" onOpen={() => openQuiz(undefined, 'Цены / 1-комнатные 37–45 м²')} /><ApartmentCard image="/images/flat-two-room.webp" alt="Двухкомнатная квартира 64 м² в ЖК Сочи Парк" promo="Рассрочка от 0% до 3 лет" title="2-ком. 64 м²" onOpen={() => openQuiz(undefined, 'Цены / 2-комнатные 64 м²')} /></div></div></section>

      <section className="video-section" id="live"><div><h2>УЗНАЙТЕ ВСЕ О КОМПЛЕКСЕ ЗА 1 МИНУТУ</h2><p>Просто посмотрите видео</p><button type="button" aria-label="Смотреть видео о жилом комплексе" onClick={() => setVideoOpen(true)}><img src="/icons/play.svg" alt="" /></button></div></section>

      <section className="investor-section" id="investor"><div className="content"><p className="eyebrow">ИНВЕСТОРУ</p><h2>Зарабатывайте до 30% годовых на<br className="desktop-only" /> строящихся корпусах</h2><p>за счет роста цен в строящихся корпусах</p><h3>График роста цен</h3><picture><source media="(max-width: 768px)" srcSet="/images/chart-mobile.svg" /><img src="/images/chart-desktop.svg" alt="График роста цен от 0% до 30%" /></picture><BlueButton onClick={() => openQuiz(undefined, 'Инвестору / Доходность')} /></div></section>

      <section className="payments-section" id="pay"><div className="content"><h2>Удобные и гибкие способы оплаты</h2><div className="payment-grid"><PaymentCard title="Ипотека" subtitle="С гос поддержкой" value="0%" suffix="год" bullets={['От 0% первоначальный взнос','До 25 лет','10 банков']} onOpen={() => openQuiz(undefined, 'Оплата / Ипотека')} /><PaymentCard title="Наличные" subtitle="Действует акция" value="-15 000" suffix="/м2" bullets={['Оформление в росреестре','Эскроу-счета']} onOpen={() => openQuiz(undefined, 'Оплата / Наличные')} /><PaymentCard title="Рассрочка" subtitle="Если нет всех денег" value="0%" suffix="/год" bullets={['6 мес без переплат','От 20% первоначальный взнос']} onOpen={() => openQuiz(undefined, 'Оплата / Рассрочка')} /></div></div></section>

      <section className="contact-section" id="contact"><div className="content"><div><h2>АДРЕС И КОНТАКТЫ</h2><p><strong>Агентство недвижимости<br />«Объединённый отдел продаж»</strong><br />Краснодарский край, Сочи,<br />микрорайон Центральный,<br />Несебрская улица, 6Б<br /><a href="tel:+79649460713">Телефон: +7 964 946-07-13</a></p></div><div className="contact-map-card" aria-label="Контакты агентства недвижимости Объединённый отдел продаж"><span className="contact-mark" aria-hidden="true">✓</span><strong>Объединённый<br />отдел продаж</strong><p>Краснодарский край, Сочи,<br />микрорайон Центральный,<br />Несебрская улица, 6Б</p><a href="tel:+79649460713">+7 964 946-07-13</a></div></div></section>
    </main>

    <footer className="site-footer" id="footer"><div className="content"><div className="footer-top"><div className="footer-about"><div className="footer-brand-mark"><Image src="/logos/oop-logo-on-light.svg" alt="Объединённый отдел продаж" width={2970} height={2645} /></div><p>Любая информация, представленная на данном сайте, носит исключительно информационный характер и ни при каких условиях не является публичной офертой, определяемой положениями статьи 437 ГК РФ.</p></div><nav><div><h3>О ЖК</h3><a href="#pricesAndAssortment">Цены и ассортимент</a><a href="#live">О комплексе</a><a href="#pay">Способы оплаты</a></div><div><h3>ИНВЕСТОРУ</h3><a href="#investor">Доходность</a></div></nav></div><div className="footer-bottom"><p>© 2026 Агентство недвижимости «Объединённый отдел продаж»</p><p>ИП Наринянц Левон Аркадьевич</p><p>ИНН 615493473476 | ОГРНИП 326619600150286</p><p>Краснодарский край, Сочи, микрорайон Центральный, Несебрская улица, 6Б</p><p>Телефон: <a href="tel:+79649460713">+7 964 946-07-13</a></p><p>р/с 40802810526070010915 · Филиал «Ростовский» АО «Альфа-Банк»</p><p>БИК 046015207 · к/с 30101810500000000207</p><p>E-mail по вопросам обработки персональных данных: <a href="mailto:Narlevon2016@gmail.com">Narlevon2016@gmail.com</a></p><p><a href="/privacy.html">Политика обработки ПДн</a> | <a href="/policy.html">Политика конфиденциальности</a></p></div></div></footer>

    {videoOpen ? <div className="video-modal" role="dialog" aria-modal="true" aria-label="Видео о жилом комплексе" onMouseDown={(event) => { if (event.target === event.currentTarget) setVideoOpen(false); }}><div><button type="button" onClick={() => setVideoOpen(false)} aria-label="Закрыть">×</button><video src="/video/complex-tour.mp4" controls autoPlay playsInline /></div></div> : null}
    <QuizModal open={quizOpen} initialPurpose={initialPurpose} successPath={quizSuccessPath} trigger={quizTrigger} onClose={() => { setQuizOpen(false); setInitialPurpose(undefined); }} />
  </>;
}
