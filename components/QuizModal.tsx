'use client';

/* eslint-disable @next/next/no-img-element -- local SVG and WebP assets preserve the source site's exact sizing */

import { useEffect, useMemo, useRef, useState } from 'react';
import { messengerOptions, quizQuestions, type QuizQuestionKey } from '@/data/quiz';
import { submitLead } from '@/lib/submitLead';

type Stage = QuizQuestionKey | 'gift' | 'giftWin' | 'bridge' | 'messenger' | 'contact';
type Answers = Partial<Record<QuizQuestionKey, string>> & { messenger?: string };

const progress: Partial<Record<Stage, number>> = { rooms: 1, finish: 2, promo: 3, messenger: 4, contact: 5 };
const backMap: Partial<Record<Stage, Stage>> = { rooms: 'purpose', finish: 'rooms', promo: 'finish', messenger: 'promo', contact: 'messenger' };

export function QuizModal({ open, initialPurpose, successPath, onClose }: { open: boolean; initialPurpose?: string; successPath: string; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>('purpose');
  const [answers, setAnswers] = useState<Answers>({});
  const [giftSpinning, setGiftSpinning] = useState(false);
  const [won, setWon] = useState(() => typeof window !== 'undefined' && sessionStorage.getItem('sochi-gift-won') === '1');
  const [aptCount, setAptCount] = useState(12);
  const [bridgePhase, setBridgePhase] = useState(0);
  const [countryCode, setCountryCode] = useState('+7');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(true);
  const [errors, setErrors] = useState<{ phone?: string; consent?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const timers = useRef<number[]>([]);
  const appliedInitialPurpose = useRef(false);

  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };

  useEffect(() => {
    if (!open) return;
    const oldBody = document.body.style.overflow;
    const oldHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = oldBody;
      document.documentElement.style.overflow = oldHtml;
      document.removeEventListener('keydown', escape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      appliedInitialPurpose.current = false;
      return;
    }
    if (!initialPurpose || stage !== 'purpose' || appliedInitialPurpose.current) return;
    // A hero choice is a command to skip the already-answered first step.
    appliedInitialPurpose.current = true;
    setAnswers((current) => ({ ...current, purpose: initialPurpose }));
    setStage('rooms');
  }, [initialPurpose, open, stage]);

  useEffect(() => () => clearTimers(), []);

  const selectedMessenger = messengerOptions.find((item) => item.value === answers.messenger);
  const digitsRequired = countryCode === '+7' ? 10 : 7;
  const phoneDigits = phone.replace(/\D/g, '').slice(0, countryCode === '+7' ? 10 : 12);
  const phoneValid = countryCode === '+7' ? /^9\d{9}$/.test(phoneDigits) : phoneDigits.length >= 7;
  const formattedPhone = useMemo(() => {
    if (countryCode !== '+7') return phoneDigits;
    return [phoneDigits.slice(0,3), phoneDigits.slice(3,6), phoneDigits.slice(6,8), phoneDigits.slice(8,10)].filter(Boolean).join(' ');
  }, [countryCode, phoneDigits]);

  const answerQuestion = (key: QuizQuestionKey, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    const next: Record<QuizQuestionKey, Stage> = { purpose: 'rooms', rooms: 'finish', finish: 'gift', promo: 'bridge' };
    const timer = window.setTimeout(() => {
      if (key === 'finish' && won) setStage('promo');
      else if (key === 'promo') startBridge(8 + Math.floor(Math.random() * 8));
      else setStage(next[key]);
    }, 300);
    timers.current.push(timer);
  };

  const startGift = () => {
    if (giftSpinning) return;
    setGiftSpinning(true);
    const winTimer = window.setTimeout(() => {
      sessionStorage.setItem('sochi-gift-won', '1');
      setWon(true);
      setStage('giftWin');
      const continueTimer = window.setTimeout(() => setStage('promo'), 3500);
      timers.current.push(continueTimer);
    }, 4400);
    timers.current.push(winTimer);
  };

  const startBridge = (count: number) => {
    setAptCount(count);
    setBridgePhase(0);
    setStage('bridge');
    [900, 2600, 4700, 6800].forEach((delay, index) => {
      timers.current.push(window.setTimeout(() => setBridgePhase(index + 1), delay));
    });
    timers.current.push(window.setTimeout(() => setStage('messenger'), 8500));
  };

  const chooseMessenger = (value: string) => {
    setAnswers((current) => ({ ...current, messenger: value }));
    timers.current.push(window.setTimeout(() => setStage('contact'), 400));
  };

  const goBack = () => {
    const previous = backMap[stage];
    if (!previous) return;
    if (previous in answers) setAnswers((current) => ({ ...current, [previous]: undefined }));
    if (stage === 'contact') setAnswers((current) => ({ ...current, messenger: undefined }));
    setStage(previous);
  };

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!phoneValid) nextErrors.phone = 'Введите верный номер телефона';
    if (!consent) nextErrors.consent = 'Необходимо согласиться с политикой конфиденциальности';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    await submitLead({
      purpose: answers.purpose || '', rooms: answers.rooms || '', finish: answers.finish || '', promo: answers.promo || '',
      messenger: answers.messenger || '', countryCode, phone: phoneDigits, name: name.trim() || undefined,
    });
    window.location.assign(successPath);
  };

  if (!open) return null;
  const question = stage in quizQuestions ? quizQuestions[stage as QuizQuestionKey] : null;
  const progressStep = progress[stage];
  const showBack = Boolean(backMap[stage]);

  return (
    <div className="quiz-overlay" role="dialog" aria-modal="true" aria-label="Подбор квартир" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="quiz-shell">
        <div className="quiz-topbar">
          {showBack ? <button type="button" className="quiz-back" onClick={goBack} aria-label="Назад">←</button> : <span />}
          {progressStep ? <div className="quiz-progress"><strong>{stage === 'contact' ? '👏 Последний шаг!' : `Шаг ${progressStep} из 5`}</strong><span><i style={{ transform: `scaleX(${progressStep / 5})` }} /></span></div> : <span />}
          <button type="button" className="quiz-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        {won && !['gift','giftWin','purpose','rooms','finish'].includes(stage) ? <div className="gift-pin">🎁 Подарок: Сертификат Hoff 50 000 ₽</div> : null}

        {question ? (
          <div className={`quiz-question ${question.key === 'purpose' ? 'purpose-question' : ''}`}>
            <img className="quiz-image" src={question.image} alt="" />
            <h2>{question.title}</h2>
            <div className={`quiz-options ${question.key === 'purpose' ? 'purpose-options' : ''}`}>
              {question.options.map((option) => (
                <button type="button" key={option.value} className={answers[question.key] === option.value ? 'selected' : ''} onClick={() => answerQuestion(question.key, option.value)}>
                  {question.key !== 'purpose' ? <span className="quiz-radio" /> : null}{option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {stage === 'gift' ? (
          <div className="gift-stage">
            <h2>Вы в розыгрыше! Крутите барабан — выиграйте ценный приз</h2>
            <div className={`gift-reel ${giftSpinning ? 'spinning' : ''}`}><span>💸 Кешбэк 100 000 ₽*</span><strong>🛋️ Сертификат Hoff 50 000 ₽*</strong><span>🏦 Бесплатное одобрение ипотеки</span></div>
            <button className="blue-button gift-button" type="button" onClick={startGift} disabled={giftSpinning}>{giftSpinning ? 'Определяем приз…' : 'Крутить барабан'}</button>
            <small>* выдаётся при приобретении квартиры</small>
          </div>
        ) : null}

        {stage === 'giftWin' ? (
          <div className="gift-win"><div>🎉</div><h2>Поздравляем!<br />Вы выиграли</h2><p>🎁 <em>Сертификат Hoff</em><strong>50 000 ₽*</strong></p><small>* выдаётся при приобретении квартиры</small></div>
        ) : null}

        {stage === 'bridge' ? (
          <div className="bridge-stage">
            {bridgePhase < 4 ? <><h2>Анализируем запрос</h2><dl><div><dt>Цель:</dt><dd>{answers.purpose}</dd></div><div><dt>Комнаты:</dt><dd>{answers.rooms}</dd></div><div><dt>Отделка:</dt><dd>{answers.finish}</dd></div><div><dt>Акция:</dt><dd>{answers.promo}</dd></div></dl><div className="bridge-loader"><i style={{ width: `${Math.max(8, bridgePhase * 25)}%` }} /></div><p>{['Ищем квартиры…','Проверяем все варианты','Загружаем цены и планировки','Готовим фото и видео'][bridgePhase]}</p></> : <><h2>Подборка готова!</h2><strong className="apt-count">{aptCount} квартир найдено</strong><p>✓ Включены 5 акционных квартир</p></>}
          </div>
        ) : null}

        {stage === 'messenger' ? (
          <div className="messenger-stage"><h2>Подборка из {aptCount} квартир — в какой мессенджер прислать?</h2><div>{messengerOptions.map((item) => <button type="button" key={item.value} onClick={() => chooseMessenger(item.value)}><img src={item.icon} alt="" /><strong>{item.label}</strong></button>)}</div></div>
        ) : null}

        {stage === 'contact' ? (
          <div className="contact-stage">
            <h2>{selectedMessenger ? <img src={selectedMessenger.icon} alt="" /> : null}Подборка из {aptCount} квартир — на какой номер {selectedMessenger?.label} отправить?</h2>
            <div className={`phone-card ${errors.phone ? 'has-error' : ''}`}>
              <div className="phone-row"><select aria-label="Код страны" value={countryCode} onChange={(event) => { setCountryCode(event.target.value); setPhone(''); setErrors({}); }}><option>+7</option><option>+380</option><option>+375</option></select><input autoFocus type="tel" aria-label="Телефон" placeholder="000 000 00 00" value={formattedPhone} onChange={(event) => { setPhone(event.target.value); setErrors((current) => ({ ...current, phone: undefined })); }} /></div>
              <div className="phone-meter"><i style={{ width: `${Math.min(100, (phoneDigits.length / digitsRequired) * 100)}%` }} /><span>{phoneValid ? 'Номер введён!' : `Осталось ${Math.max(0, digitsRequired - phoneDigits.length)} цифр`}</span></div>
              {errors.phone ? <p className="field-error">{errors.phone}</p> : null}
              <p className="secure"><img src="/icons/shield.svg" alt="" />Ваши данные надёжно защищены</p>
              {phoneValid ? <div className="contact-extra"><label>Имя (необязательно)<input type="text" placeholder="Как вас зовут?" value={name} onChange={(event) => setName(event.target.value)} /></label><button className="blue-button" type="button" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Готовим подборку…' : 'Смотреть мою подборку'}</button><p className="benefits">✓ Бесплатно &nbsp;&nbsp; ✓ Без обязательств</p><label className={`consent ${errors.consent ? 'has-error' : ''}`}><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setErrors((current) => ({ ...current, consent: undefined })); }} />Я даю согласие на обработку <a href="/privacy.html" target="_blank">моих персональных данных</a> ООО «Элитный Сочи» в соответствии с <a href="/policy.html" target="_blank">политикой конфиденциальности</a></label>{errors.consent ? <div className="toast-error">{errors.consent}</div> : null}</div> : null}
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
