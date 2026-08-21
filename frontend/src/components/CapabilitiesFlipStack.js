import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import theme from "../theme";

const ITEMS = [
  {
    title: "Role-Based Workflow",
    description: "Tailored dashboards for Admins, Faculty Advisors, Organizers, and Students. Every role sees exactly what it needs — nothing more, nothing less.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&q=90&auto=format&fit=crop",
    imageAlt: "Team working together in a meeting",
    background: theme.colors.maroon,
    foreground: theme.colors.white,
  },
  {
    title: "Automated Brochures",
    description: "Generate print-ready and digital event brochures instantly. Consistent university branding is applied automatically to every publication.",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1400&q=90&auto=format&fit=crop",
    imageAlt: "Printed materials and brochures on a desk",
    background: theme.colors.gold,
    foreground: theme.colors.maroonDark,
  },
  {
    title: "QR Check-In",
    description: "Issue unique QR codes to registered participants. On-site scanning marks attendance in real time, eliminating paper lists entirely.",
    image: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=1400&q=90&auto=format&fit=crop",
    imageAlt: "Person holding a phone scanning a code",
    background: theme.colors.maroonDark,
    foreground: theme.colors.goldLight,
  },
  {
    title: "Budget Tracking",
    description: "Submit, review, and approve event budgets through a transparent workflow. Track expenditure against allocation with visual progress charts.",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1400&q=90&auto=format&fit=crop",
    imageAlt: "Financial documents and charts",
    background: theme.colors.goldLight,
    foreground: theme.colors.maroon,
  },
  {
    title: "Historical Records",
    description: "A rich archive of every past event — photos, reports, attendance data, and budgets — instantly searchable and filterable by year, type, or department.",
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1400&q=90&auto=format&fit=crop",
    imageAlt: "Library interior with books",
    background: theme.colors.maroon,
    foreground: theme.colors.white,
  },
  {
    title: "User Management",
    description: "Seamlessly onboard and manage students, faculty, and administrators. Assign system roles and departments directly from a centralized admin dashboard.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&q=90&auto=format&fit=crop",
    imageAlt: "Team of people collaborating on laptops",
    background: theme.colors.gold,
    foreground: theme.colors.maroonDark,
  },
  {
    title: "Analytics & Reports",
    description: "Institution-wide event analytics: participation trends, departmental contributions, budget utilisation, and engagement metrics — all in one place.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=90&auto=format&fit=crop",
    imageAlt: "Laptop screen displaying charts and analytics",
    background: theme.colors.maroonDark,
    foreground: theme.colors.goldLight,
  },
];

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

function FlipCard({ item, index, total, progress, reduceMotion, windowWidth }) {
  const segment = 1 / Math.max(total, 1);
  const start = index * segment;
  const end = Math.min(start + segment, 1);
  const entryStart = Math.max(0, start - segment);
  const entryEnd = index === 0 ? 0.0001 : Math.min(start, entryStart + segment * 0.7);
  const exitStart = start;
  const exitEnd = end;
  
  const stackedCardGap = Math.min(24, 72 / Math.max(total - 1, 1));
  const stackedOffset = index * stackedCardGap;
  const restingOffset = Math.min(index * 12, 34);
  const restingScale = 1 - Math.min(index * 0.012, 0.035);

  const exitYPercent = useTransform(
    progress,
    [exitStart, exitEnd],
    reduceMotion ? [0, 0] : [0, -118]
  );
  
  const exitStackOffset = useTransform(
    progress,
    [exitStart, exitEnd],
    reduceMotion ? [0, 0] : [0, stackedOffset]
  );
  
  const exitY = useMotionTemplate`calc(${exitYPercent}% + ${exitStackOffset}px)`;
  
  const rotateX = useTransform(
    progress,
    [exitStart, exitEnd],
    reduceMotion ? [0, 0] : [0, 22]
  );
  
  const opacity = useTransform(
    progress,
    [exitStart, exitEnd],
    reduceMotion ? [1, 0] : [1, 1]
  );
  
  const entryScale = useTransform(
    progress,
    [entryStart, entryEnd],
    index === 0 ? [1, 1] : [restingScale, 1]
  );
  
  const entryY = useTransform(
    progress,
    [entryStart, entryEnd],
    index === 0 ? [0, 0] : [restingOffset, 0]
  );

  const isMobile = windowWidth > 0 && windowWidth < 640;

  return (
    <motion.article
      style={{
        position: 'absolute',
        inset: '0 0 auto 0',
        aspectRatio: isMobile ? '3/4' : '1.76/1',
        willChange: 'transform',
        y: exitY,
        rotateX,
        opacity,
        zIndex: total - index,
        transformOrigin: "50% 50%",
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
      }}
    >
      <motion.div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.15fr 0.85fr',
          height: '100%',
          overflow: 'hidden',
          borderRadius: `clamp(18px, 2vw, 30px)`,
          boxShadow: '0 16px 50px rgba(74,4,4,0.18)',
          backgroundColor: item.background,
          color: item.foreground,
          y: entryY,
          scale: entryScale,
          transformOrigin: "50% 100%",
        }}
      >
        <div style={{
          display: 'flex',
          minWidth: 0,
          flexDirection: 'column',
          padding: `clamp(24px, 3vw, 48px)`,
          paddingRight: isMobile ? `clamp(24px, 3vw, 48px)` : `clamp(22px, 3vw, 48px)`
        }}>
          <div style={{
            marginTop: 'auto',
            maxWidth: '46rem',
            paddingTop: '2rem'
          }}>
            <h2 style={{
              maxWidth: '16ch',
              textWrap: 'balance',
              fontSize: `clamp(28px, 3.25vw, 48px)`,
              fontWeight: theme.fontWeights.bold,
              lineHeight: 0.96,
              letterSpacing: '-0.05em',
              fontFamily: theme.fonts.serif,
              marginBottom: '1rem'
            }}>
              {item.title}
            </h2>
            <p style={{
              marginTop: `clamp(16px, 1.8vw, 24px)`,
              maxWidth: '42rem',
              fontSize: `clamp(14px, 1.1vw, 16px)`,
              lineHeight: 1.5,
              opacity: 0.85,
              fontFamily: theme.fonts.sansSerif
            }}>
              {item.description}
            </p>
          </div>
        </div>

        <div style={{
          position: 'relative',
          margin: `clamp(10px, 1.2vw, 18px)`,
          marginLeft: isMobile ? undefined : 0,
          minHeight: '180px',
          overflow: 'hidden',
          borderRadius: `clamp(12px, 1.4vw, 22px)`,
        }}>
          <img
            src={item.image}
            alt={item.imageAlt}
            loading={index < 2 ? "eager" : "lazy"}
            draggable={false}
            style={{
              height: '100%',
              width: '100%',
              objectFit: 'cover'
            }}
          />
          <div style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top right, rgba(0,0,0,0.1), transparent, rgba(255,255,255,0.05))'
          }} />
        </div>
      </motion.div>
    </motion.article>
  );
}

export default function CapabilitiesFlipStack() {
  const stackRef = useRef(null);
  const reduceMotion = useReducedMotion() ?? false;
  const windowWidth = useWindowSize()[0];
  
  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ["start start", "end end"],
  });
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    mass: 1,
    restDelta: 0.0005,
  });
  
  const cardProgress = reduceMotion ? scrollYProgress : smoothProgress;

  return (
    <div style={{ position: 'relative', backgroundColor: theme.colors.offWhite, color: theme.colors.charcoal, fontFamily: theme.fonts.sansSerif, paddingTop: '4rem' }}>
      
      {/* Scroll Hint Section */}
      <section style={{ position: 'relative', height: '60vh', minHeight: '400px', overflow: 'hidden', padding: '0 2rem' }}>
        <div style={{
          position: 'absolute',
          inset: '100px 0 auto 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          textAlign: 'center'
        }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(253,208,111,0.2)',
            color: '#B27B16',
            padding: '0.4rem 1.25rem',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>Capabilities</span>
          <h2 style={{
            fontSize: `clamp(2.5rem, 4vw, 3.5rem)`,
            color: theme.colors.maroon,
            fontWeight: 'bold',
            fontFamily: theme.fonts.serif,
            letterSpacing: '-0.02em',
            margin: '0.5rem 0'
          }}>Everything You Need to Run a Great Event</h2>
          <p style={{
            fontSize: '1.1rem',
            color: theme.colors.midGray,
            maxWidth: '600px',
            lineHeight: 1.5,
          }}>
            Scroll down to explore the powerful modules built around the real workflow of university event teams.
          </p>
          <div style={{
            marginTop: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: `clamp(14px, 2.5vw, 32px)`,
            fontSize: `clamp(22px, 3.5vw, 42px)`,
            fontWeight: theme.fontWeights.medium,
            color: theme.colors.goldDark,
          }}>
            <motion.span
              aria-hidden="true"
              animate={reduceMotion ? undefined : { y: [0, 10, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >↓</motion.span>
          </div>
        </div>
      </section>

      {/* Stacked Cards Section */}
      <div
        ref={stackRef}
        style={{ position: 'relative', height: `${(ITEMS.length + 1) * 100}vh` }}
      >
        <div style={{
          position: 'sticky',
          top: '72px',
          display: 'flex',
          height: 'calc(100vh - 72px)',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: `clamp(14px, 4vw, 64px) 2rem`,
        }}>
          <div style={{
            position: 'relative',
            margin: '0 auto',
            width: '100%',
            maxWidth: '1000px',
            perspective: '800px',
            aspectRatio: (windowWidth > 0 && windowWidth < 640) ? '3/4' : '1.76/1'
          }}>
            {[...ITEMS].reverse().map((item, reverseIndex) => {
              const index = ITEMS.length - reverseIndex - 1;
              return (
                <FlipCard
                  key={`${item.title}-${index}`}
                  item={item}
                  index={index}
                  total={ITEMS.length}
                  progress={cardProgress}
                  reduceMotion={reduceMotion}
                  windowWidth={windowWidth}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
