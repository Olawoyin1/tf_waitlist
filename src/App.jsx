import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Select } from './components/Select'
import { GridVignetteBackground } from './components/ui/vignette-grid-background'
import { RiUserLine, RiMailLine, RiBriefcaseLine, RiBuildingLine, RiCheckLine } from 'react-icons/ri'
import ConfettiExplosion from 'react-confetti-explosion'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AdminDashboard } from './components/AdminDashboard'
import { Toaster, toast } from 'sonner'

const API_URL = 'http://localhost:5000/api/waitlist'

const LOGOS = Array.from({ length: 10 }, (_, i) =>
  `https://talent-factory-tau.vercel.app/logos/logo-${i + 1}.svg`
)

const CHECK_ICON = (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.78 5.78a.75.75 0 00-1.06-1.06L7 9.44 5.28 7.72a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25z"/>
  </svg>
)

// ── Animation variants ─────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay } },
})

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const heroItem = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}

// ── Scroll-reveal wrapper ──────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={stagger(delay)}
    >
      {children}
    </motion.div>
  )
}

// ── Count-up ───────────────────────────────────────────────────────────────────
function CountUp({ target, suffix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    const isDecimal = target % 1 !== 0
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / 1400, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(isDecimal ? parseFloat((eased * target).toFixed(1)) : Math.round(eased * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target])

  return <span ref={ref}>{val}{suffix}</span>
}

// ── Waitlist Form ──────────────────────────────────────────────────────────────
function WaitlistForm() {
  const [fields, setFields] = useState({ fullName: '', email: '', interest: '', company: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const set = (key) => (e) => {
    const val = typeof e === 'string' ? e : e.target.value
    setFields(f => ({ ...f, [key]: val }))
    setErrors(er => ({ ...er, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!fields.fullName.trim()) e.fullName = 'Please enter your full name.'
    if (!fields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = 'Please enter a valid email address.'
    if (!fields.interest) e.interest = 'Please select an option.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fields.fullName.trim(),
          email: fields.email.trim(),
          interest: fields.interest,
          company: fields.company.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          toast.warning('Already registered', {
            description: 'This email is already on our waitlist. Check your inbox for your confirmation.',
          })
        } else {
          toast.error('Something went wrong', {
            description: data.message || 'Please try again.',
          })
        }
        setLoading(false)
        return
      }
      setSuccessData(data.data)
      setSuccess(true)
      setShowConfetti(true)
      toast.success("You're on the priority list!", {
        description: `Spot reserved for ${data.data?.email}. Check your inbox!`,
      })
    } catch (_) {
      toast.error('Network error', {
        description: 'Please check your connection and try again.',
      })
    }
    setLoading(false)
  }

  if (success) return (
    <>
      {showConfetti && <ConfettiExplosion onDone={() => setShowConfetti(false)} />}
      <motion.div
        className="form-success-card"
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="form-success-badge">
          <RiCheckLine size={24} />
        </div>
        <h3 className="form-success-title">You're on the priority list!</h3>
        <p className="form-success-desc">
          Spot reserved for <strong>{successData?.email}</strong>. A confirmation email is on its way to your inbox!
        </p>
        <div className="form-success-actions">
          <a href="https://talentfactoryhq.substack.com" target="_blank" rel="noopener noreferrer" className="form-success-btn form-success-btn--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Subscribe to Newsletter
          </a>
          <a href="https://chat.whatsapp.com/Gg3pCbWCa6iDlV53deSqBL?s=cl&p=a&mlu=4&ilr=4" target="_blank" rel="noopener noreferrer" className="form-success-btn form-success-btn--outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Join the Community
          </a>
        </div>
      </motion.div>
    </>
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="mini-form">
      {/* Form Header */}
      <div className="mini-form__head">
        <h2 className="mini-form__title">Join the waitlist</h2>
        <p className="mini-form__sub">Be first in line when learning cohorts launch.</p>
      </div>

      {/* Input Fields */}
      <div className="fields-group">
        <div className="field">
          <div className="input-wrap">
            <RiUserLine className="input-icon" />
            <input
              id="full-name"
              type="text"
              autoComplete="name"
              placeholder="Full name"
              value={fields.fullName}
              onChange={set('fullName')}
              className={errors.fullName ? 'err' : ''}
            />
          </div>
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </div>

        <div className="field">
          <div className="input-wrap">
            <RiMailLine className="input-icon" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={fields.email}
              onChange={set('email')}
              className={errors.email ? 'err' : ''}
            />
          </div>
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <Select
            value={fields.interest}
            onValueChange={set('interest')}
            placeholder="I am an HR professional…"
            hasError={!!errors.interest}
            icon={<RiBriefcaseLine />}
            options={[
              { value: 'Practising HR professional', label: 'Practising HR professional' },
              { value: 'HR specialist / HRBP',        label: 'HR specialist / HRBP' },
              { value: 'HR manager / leader',          label: 'HR manager / leader' },
              { value: 'HR consultant',                label: 'HR consultant' },
              { value: 'Other HR role',                label: 'Other HR role' },
            ]}
          />
          {errors.interest && <span className="field-error">{errors.interest}</span>}
        </div>

        <div className="field">
          <div className="input-wrap">
            <RiBuildingLine className="input-icon" />
            <input
              id="company"
              type="text"
              autoComplete="organization"
              placeholder="Company or organisation (optional)"
              value={fields.company}
              onChange={set('company')}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="submit-wrap">
        <motion.button
          className={`submit-btn-modern${loading ? ' loading' : ''}`}
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.015, y: -1 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        >
          <span className="submit-btn-modern__content">
            <span>Join Waitlist</span>
          </span>
          <span className="submit-btn-modern__spin" aria-hidden="true" />
        </motion.button>
      </div>
    </form>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────────
function WaitlistPage() {
  return (
    <>
      {/* NAV */}
      <motion.header
        className="nav"
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <a href="#" className="nav__logo">
          <svg viewBox="0 0 172 172" width="30" height="30" aria-hidden="true">
            <path fill="#131216" d="M86,0C38.5,0,0,38.5,0,86s38.5,86,86,86,86-38.5,86-86S133.5,0,86,0ZM127.56,122.24l-1.5,1.44c-2.73,2.62-5.72,4.98-8.9,7.01-8,5.12-17.24,8.21-26.72,8.93-1.51.11-3,.17-4.45.17s-2.94-.06-4.44-.17c-9.49-.72-18.73-3.81-26.73-8.93-3.18-2.04-6.18-4.4-8.9-7.02l-1.5-1.44V52.59h17.89v61.55c5.87,4.32,12.76,6.94,20.03,7.59,2.41.22,4.86.22,7.28,0,7.27-.65,14.17-3.27,20.03-7.59v-51.81h-14.72v44.85h-17.89V32.82l4.43-.4c3-.27,6.04-.27,9.04,0l4.43.4v11.62h32.62v77.8Z"/>
          </svg>
          <span>Talent Factory</span>
        </a>
      </motion.header>

      <main>
        {/* HERO */}
        <section className="hero-minimal">
          <GridVignetteBackground size={48} x={50} y={50} horizontalVignetteSize={80} verticalVignetteSize={60} intensity={20} />

          <motion.div
            className="hero-minimal__content"
            variants={heroContainer}
            initial="hidden"
            animate="show"
          >
            <div className="hero-copy-col">
              <motion.div className="badge badge--light" variants={heroItem}>
                <span className="badge__pulse"></span>
                Early access — limited spots
              </motion.div>

              <motion.h2 className="headline-hero-minimal" variants={heroItem}>
                The people who keep your business running.
              </motion.h2>

              <motion.p className="lede-hero-minimal" variants={heroItem}>
                Talent Factory trains and places the operators that power great companies — executive assistants, accountants, marketers, ops leads, and more.
              </motion.p>
            </div>

            <motion.div
              className="hero-form-col"
              variants={scaleIn}
              transition={{ delay: 0.2 }}
            >
              <div className="form-card" id="waitlist-card">
                <WaitlistForm />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* PARTNER COMPANIES */}
        <Reveal>
          <section className="partner-section">
            <div className="partner-section__inner">
              <p className="partner-label">TRUSTED BY HR PROFESSIONALS FROM LEADING ORGANISATIONS</p>
              <div className="partner-marquee-container">
                <div className="partner-marquee-track">
                  {[
                    'MTN','Remoteworkher','TechCabal','Xara','BMoni',
                    'GetSeen','Ruxe','SendCoins','BizFlex','CompasAI',
                    'MTN','Remoteworkher','TechCabal','Xara','BMoni',
                    'GetSeen','Ruxe','SendCoins','BizFlex','CompasAI',
                  ].map((name, i) => (
                    <span key={i} className="partner-name">{name}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* FEATURES */}
        <section className="features-section">
          <div className="features-section__inner">
            <Reveal>
              <div className="features-header">
                <div className="features-header__left">
                  <div className="features-eyebrow">
                    <span className="features-eyebrow__dot" />
                    Why Talent Factory
                  </div>
                  <h2 className="features-headline">
                    A CV tells you nothing.<br/>
                    <span className="features-headline__gold">We tell you everything.</span>
                  </h2>
                </div>
                <div className="features-header__right">
                  <p className="features-sub">Job boards hand you a stack of strangers and wish you luck. We hand you someone we taught, tested, and would stake our name on.</p>
                  <div className="features-header__line" />
                </div>
              </div>
            </Reveal>

            <div className="features-bento">
              {[
                { bg: 'linear-gradient(145deg, #c8f0d9 0%, #a8e6c3 100%)', icon: 'team-fill',         span: 'bento-wide',  num: '01', title: 'Tested, not just trusted',       body: 'Real skills checked against real tasks before anyone reaches your inbox. No guesswork, no gambles.' },
                { bg: 'linear-gradient(145deg, #ffd9c0 0%, #ffcba4 100%)', icon: 'pencil-fill',        span: 'bento-tall',  num: '02', title: 'We taught them ourselves',       body: 'Not pulled off a job board, trained by Talent Factory to a standard we can promise.' },
                { bg: 'linear-gradient(145deg, #c0d5ff 0%, #a3c0ff 100%)', icon: 'shield-star-fill',   span: 'bento-tall',  num: '03', title: 'The admin is on us',             body: 'Contracts, onboarding, payment, handled, so you just get the work done.' },
                { bg: 'linear-gradient(145deg, #f0eee8 0%, #e8e4dc 100%)', icon: 'psychotherapy-fill', span: 'bento-wide',  num: '04', title: "If it doesn't click, we re-match", body: "An early mismatch isn't your problem to fix. We replace them, no fuss, no friction." },
              ].map(({ bg, icon, span, num, title, body }, i) => (
                <Reveal key={title} delay={i * 0.1}>
                  <motion.div
                    className={`bento-card ${span}`}
                    style={{ background: bg }}
                    whileHover={{ y: -8, scale: 1.015, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                  >
                    <div className="bento-card__inner">
                      <span className="bento-num">{num}</span>
                      <div className="bento-text">
                        <h3>{title}</h3>
                        <p>{body}</p>
                      </div>
                    </div>
                    <div className="bento-icon-wrap">
                      <img src={`https://talent-factory-tau.vercel.app/icons/${icon}.svg`} alt="" className="bento-icon" />
                    </div>
                    <div className="bento-card__shine" />
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* STICKY STEPS */}
        <section className="sticky-steps-section">
          <div className="sticky-steps__inner">
            <Reveal>
              <div className="section-header section-header--center">
                <p className="eyebrow">What happens next</p>
                <h2>Three steps to your first great hire</h2>
              </div>
            </Reveal>
            <div className="sticky-cards-stack">
              {[
                { wrap: 'wrap-1', card: 'card-1', num: '01', title: 'Join the waitlist',   body: "Fill in your details. Tell us whether you're looking to hire or be placed — we prioritise accordingly." },
                { wrap: 'wrap-2', card: 'card-2', num: '02', title: 'We open your access', body: "When your slot is ready, you'll get a personal email with a link to complete your brief or profile." },
                { wrap: 'wrap-3', card: 'card-3', num: '03', title: 'Start working',        body: 'Businesses get a shortlist in days. Talent gets matched live. Contracts and onboarding — all handled.' },
              ].map(({ wrap, card, num, title, body }) => (
                <div key={num} className={`step-card-wrap ${wrap}`}>
                  <div className={`step-card ${card}`}>
                    <span className="step-num" aria-hidden="true">{num}</span>
                    <span className="step-label">Step {num}</span>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AUDIENCE */}
        <section className="audience">
          <div className="audience__inner">
            <Reveal>
              <div className="section-header section-header--center">
                <p className="eyebrow">Who this is for</p>
                <h2>Built for both sides of the table</h2>
              </div>
            </Reveal>
            <div className="audience-panels">
              {[
                {
                  dark: true,
                  badge: 'For businesses', heading: 'Stop winging\nthe hire.',
                  body: "You shouldn't have to scroll through job boards, screen strangers and cross your fingers. We hand you someone we trained, tested and would stake our name on.",
                  list: ['Pre-vetted shortlist within days','Contracts & onboarding handled',"Free re-match if it doesn't work",'Hire for keeps, by project, or hand us a function'],
                  cta: 'Get early access', ctaClass: 'panel__btn--light',
                },
                {
                  dark: false,
                  badge: 'For talent', heading: 'Get placed in a\nbusiness that fits.',
                  body: "We train you, certify you, and match you to companies that are actually ready for you. No cold applications, no ghosting.",
                  list: ['Training & certification included','Matched to vetted businesses','We handle the admin side','Ongoing support after placement'],
                  cta: 'Join the talent pool ↓', ctaClass: 'panel__btn--dark',
                },
              ].map(({ dark, badge, heading, body, list, cta, ctaClass }, i) => (
                <Reveal key={badge} delay={i * 0.12}>
                  <motion.div
                    className={`panel ${dark ? 'panel--dark' : 'panel--light'}`}
                    whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
                  >
                    <div className={`panel__badge${dark ? '' : ' panel__badge--dark'}`}>{badge}</div>
                    <h3 className={`panel__heading${dark ? '' : ' panel__heading--dark'}`}>
                      {heading.split('\n').map((line, j) => <span key={j}>{line}{j === 0 && <br/>}</span>)}
                    </h3>
                    <p className={`panel__body${dark ? '' : ' panel__body--dark'}`}>{body}</p>
                    <ul className={`panel__list${dark ? '' : ' panel__list--dark'}`}>
                      {list.map(item => <li key={item}>{CHECK_ICON}{item}</li>)}
                    </ul>
                    <a href="#waitlist-card" className={`panel__btn ${ctaClass}`}>{cta}</a>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats-bar" aria-label="Key numbers">
          <div className="stats-bar__inner">
            {[
              { n: 500, suffix: '+', label: 'Vetted operators ready to start' },
              { n: 9,   suffix: '',  label: 'Talent categories we specialize in' },
              { n: 100, suffix: '%', label: 'Trained & certified before you meet them' },
              { n: 4.9, suffix: '★', label: 'Rated by 500+ businesses who use us' },
            ].map(({ n, suffix, label }, i) => (
              <>
                {i > 0 && <div key={`div-${i}`} className="stat-divider" aria-hidden="true" />}
                <Reveal key={label} delay={i * 0.1} className="stat-item">
                  <span className="stat-item__n"><CountUp target={n} suffix={suffix} /></span>
                  <span className="stat-item__l">{label}</span>
                </Reveal>
              </>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <Reveal>
          <section className="final-cta">
            <div className="final-cta__inner">
              <div className="final-cta__tag">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Spots filling up
              </div>
              <h2 className="final-cta__heading">Don't wait until<br/>you're desperate to hire.</h2>
              <p className="final-cta__sub">The best operators get matched fast. Join the waitlist now and we'll have someone ready for you when you need them.</p>
              <motion.a
                href="#waitlist-card"
                className="final-cta__btn"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              >
                Secure my spot now
              </motion.a>
            </div>
          </section>
        </Reveal>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__left">
            <div className="footer__brand">
              <svg viewBox="0 0 172 172" width="24" height="24" aria-hidden="true"><path fill="#131216" d="M86,0C38.5,0,0,38.5,0,86s38.5,86,86,86,86-38.5,86-86S133.5,0,86,0ZM127.56,122.24l-1.5,1.44c-2.73,2.62-5.72,4.98-8.9,7.01-8,5.12-17.24,8.21-26.72,8.93-1.51.11-3,.17-4.45.17s-2.94-.06-4.44-.17c-9.49-.72-18.73-3.81-26.73-8.93-3.18-2.04-6.18-4.4-8.9-7.02l-1.5-1.44V52.59h17.89v61.55c5.87,4.32,12.76,6.94,20.03,7.59,2.41.22,4.86.22,7.28,0,7.27-.65,14.17-3.27,20.03-7.59v-51.81h-14.72v44.85h-17.89V32.82l4.43-.4c3-.27,6.04-.27,9.04,0l4.43.4v11.62h32.62v77.8Z"/></svg>
              <span>Talent Factory</span>
            </div>
            <p>Every great company runs on people you never see. We train and place the operators behind the business.</p>
          </div>
          <nav className="footer__nav" aria-label="Footer">
            <div>
              <p className="footer__nav-head">Platform</p>
              <a href="#">Find Talent</a>
              <a href="#">Pricing</a>
              <a href="#">Hire Someone</a>
            </div>
            <div>
              <p className="footer__nav-head">For Talent</p>
              <a href="#">Why Talent Factory</a>
              <a href="#">Join as Talent</a>
            </div>
          </nav>
        </div>
        <div className="footer__bottom">
          <p>&copy; 2026 Talent Factory. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors expand={false} />
      <Routes>
        <Route path="/" element={<WaitlistPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
