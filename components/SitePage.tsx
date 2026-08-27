'use client';

/* eslint-disable @next/next/no-img-element -- inline local SVGs match the audited source dimensions */

import Image from 'next/image';
import { useEffect, useState } from 'react';
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
  const [videoOpen, setVideoOpen] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(1);

  useEffect(() => {
    document.documentElement.dataset.appReady = 'true';
    const phraseTimer = window.setInterval(() => setPhraseIndex((index) => (index + 1) % heroPhrases.length), 2500);
    const quizTimer = window.setTimeout(() => { setInitialPurpose(undefined); setQuizSuccessPath('/spasibo2.html?region=eu'); setQuizOpen(true); }, 17000);
    return () => { delete document.documentElement.dataset.appReady; window.clearInterval(phraseTimer); window.clearTimeout(quizTimer); };
  }, []);

  useEffect(() => {
    if (!videoOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setVideoOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [videoOpen]);

  const openQuiz = (purpose?: string) => { setInitialPurpose(purpose); setQuizSuccessPath('/spasibo.html?region=eu'); setQuizOpen(true); };

  return <>
    <main>
      <section className="hero" id="header">
        <header className="hero-header"><Image src="/logos/logo.webp" alt="Сочи Парк" width={300} height={100} priority /></header>
        <div className="hero-inner"><h1>Смотрите подборки<br />квартир у моря</h1><p className="hero-rotator" aria-live="polite">{heroPhrases[phraseIndex]}<span>|</span></p><div className="hero-finance"><div><span>ИПОТЕКА ОТ</span><strong>20 000 ₽/мес.</strong></div><div><span>ПЕРВЫЙ ВЗНОС ОТ</span><strong>0 ₽</strong></div></div><div className="purpose-card" aria-label="Выберите цель покупки"><div className="purpose-grid"><button type="button" onClick={() => openQuiz('Жить на море')}>Жить</button><button type="button" onClick={() => openQuiz('Отдыхать')}>Отдыхать</button><button type="button" onClick={() => openQuiz('Перепродать')}>Перепродать</button><button type="button" onClick={() => openQuiz('Сдавать в аренду')}>Сдавать</button></div><p><img src="/icons/clock.svg" alt="" /><strong>1 минута</strong></p></div><div className="trust-row" aria-label="Рейтинги и партнёры"><span><Image src="/logos/logo-yandex.webp" alt="Яндекс" width={56} height={56} />4,9</span><span><Image src="/logos/logo-2gis.webp" alt="2ГИС" width={56} height={56} />4,7</span><span>Платиновый<br />партнёр</span><Image src="/logos/logo-sber.webp" alt="Сбер" width={56} height={56} /><Image src="/logos/logo-alfa.webp" alt="Альфа-Банк" width={56} height={56} /><Image src="/logos/logo-sovcom.webp" alt="Совкомбанк" width={56} height={56} /></div></div>
      </section>

      <section className="prices-section" id="pricesAndAssortment"><div className="content"><h2>Цены и ассортимент</h2><div className="apartment-grid"><ApartmentCard image="/images/flat-studio.webp" alt="Студия 16-24 м² в ЖК Сочи Парк" promo="Ипотека от 0,8% | Рассрочка от 0%" title="Студии 16-24 м²" onOpen={() => openQuiz()} /><ApartmentCard image="/images/flat-one-room.webp" alt="Однокомнатная квартира 37-45 м² в ЖК Сочи Парк" promo="Рассрочка от 0% до 3 лет" title="1-ком. 37-45 м²" onOpen={() => openQuiz()} /><ApartmentCard image="/images/flat-two-room.webp" alt="Двухкомнатная квартира 64 м² в ЖК Сочи Парк" promo="Рассрочка от 0% до 3 лет" title="2-ком. 64 м²" onOpen={() => openQuiz()} /></div></div></section>

      <section className="video-section" id="live"><div><h2>УЗНАЙТЕ ВСЕ О КОМПЛЕКСЕ ЗА 1 МИНУТУ</h2><p>Просто посмотрите видео</p><button type="button" aria-label="Смотреть видео о жилом комплексе" onClick={() => setVideoOpen(true)}><img src="/icons/play.svg" alt="" /></button></div></section>

      <section className="investor-section" id="investor"><div className="content"><p className="eyebrow">ИНВЕСТОРУ</p><h2>Зарабатывайте до 30% годовых на<br className="desktop-only" /> строящихся корпусах</h2><p>за счет роста цен в строящихся корпусах</p><h3>График роста цен</h3><picture><source media="(max-width: 768px)" srcSet="/images/chart-mobile.svg" /><img src="/images/chart-desktop.svg" alt="График роста цен от 0% до 30%" /></picture><BlueButton onClick={() => openQuiz()} /></div></section>

      <section className="payments-section" id="pay"><div className="content"><h2>Удобные и гибкие способы оплаты</h2><div className="payment-grid"><PaymentCard title="Ипотека" subtitle="С гос поддержкой" value="0%" suffix="год" bullets={['От 0% первоначальный взнос','До 25 лет','10 банков']} onOpen={() => openQuiz()} /><PaymentCard title="Наличные" subtitle="Действует акция" value="-15 000" suffix="/м2" bullets={['Оформление в росреестре','Эскроу-счета']} onOpen={() => openQuiz()} /><PaymentCard title="Рассрочка" subtitle="Если нет всех денег" value="0%" suffix="/год" bullets={['6 мес без переплат','От 20% первоначальный взнос']} onOpen={() => openQuiz()} /></div></div></section>

      <section className="contact-section" id="contact"><div className="content"><div><h2>АДРЕС И КАРТА</h2><p><strong>г. Сочи, Ясногорская, 16/8</strong><br />Пн-Пт: с 9:00 до 18:00<br />Сб: с 10:00 до 17:00<br />Вс: с 10:00 до 16:00<br /><a href="tel:+78001001774">Телефон: +7 (800) 100-1774</a></p></div><Image src="/images/map.webp" alt="Карта — Ясногорская улица, 16/8" width={600} height={400} /></div></section>
    </main>

    <footer className="site-footer" id="footer"><div className="content"><div className="footer-top"><div className="footer-about"><Image src="/logos/logo.webp" alt="Сочи Парк" width={300} height={100} /><p>Любая информация, представленная на данном сайте, носит исключительно информационный характер и ни при каких условиях не является публичной офертой, определяемой положениями статьи 437 ГК РФ.</p></div><nav><div><h3>О ЖК</h3><a href="#pricesAndAssortment">Цены и ассортимент</a><a href="#live">О комплексе</a><a href="#pay">Способы оплаты</a></div><div><h3>ИНВЕСТОРУ</h3><a href="#investor">Доходность</a></div></nav></div><div className="footer-bottom"><p>© 2025 ООО «Элитный Сочи»</p><p>ИНН 2320219067 | ОГРН 1142366002899</p><p>354000, Краснодарский край, г. Сочи, ул. Пластунская, д. 70</p><p>E-mail по вопросам обработки персональных данных: <a href="mailto:privacy@sochipark-info.ru">privacy@sochipark-info.ru</a></p><p><a href="/privacy.html">Политика обработки ПДн</a> | <a href="/policy.html">Политика конфиденциальности</a></p></div></div></footer>

    {videoOpen ? <div className="video-modal" role="dialog" aria-modal="true" aria-label="Видео о жилом комплексе" onMouseDown={(event) => { if (event.target === event.currentTarget) setVideoOpen(false); }}><div><button type="button" onClick={() => setVideoOpen(false)} aria-label="Закрыть">×</button><video src="/video/complex-tour.mp4" controls autoPlay playsInline /></div></div> : null}
    <QuizModal open={quizOpen} initialPurpose={initialPurpose} successPath={quizSuccessPath} onClose={() => { setQuizOpen(false); setInitialPurpose(undefined); }} />
  </>;
}
