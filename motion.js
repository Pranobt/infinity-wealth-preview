// Scroll motion for the Infinity site: GSAP + ScrollTrigger + SplitText.
// Runs only when <html> has .motion (set in <head> for users without a reduced-motion preference).
// Every effect animates transform/opacity, or the .hl background, and ends in the normal, readable state.
(() => {
  const root = document.documentElement;
  const nav = document.querySelector('.nav');

  // The nav firms up once the page scrolls. This is a colour/shadow change, so it runs for everyone.
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!root.classList.contains('motion')) return;
  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) { root.classList.remove('motion'); return; }
  window.motionReady = true;

  gsap.registerPlugin(ScrollTrigger, SplitText);
  const ease = 'power3.out';

  // Line masks are one line-box tall, and the headings' tight line height would clip descenders (g, y, p).
  // Extend each mask downwards and pull the next line back up, so nothing is cut and the layout doesn't move.
  // Once a heading has animated in, remove the split wrappers so nothing can clip it at rest. .is-done keeps its highlight on.
  const settle = (el, split) => () => { split.revert(); el.classList.add('is-done'); };
  const roomy = (split) => { (split.masks || []).forEach((m) => { m.style.paddingBottom = '0.25em'; m.style.marginBottom = '-0.25em'; }); return split; };

  // Split text only after Inter has loaded, so line breaks are measured with the real font.
  document.fonts.ready.then(() => {

    // 1. Hero: headline rises word by word out of a line mask, then the copy, the buttons and the cards.
    const h1 = document.querySelector('.hero h1');
    const heroSplit = roomy(SplitText.create(h1, { type: 'lines,words', mask: 'lines' }));
    gsap.set(h1, { autoAlpha: 1 });
    const intro = gsap.timeline({ defaults: { ease } });
    const settleHero = settle(h1, heroSplit);
    intro
      .from(heroSplit.words, { yPercent: 110, duration: 1, stagger: 0.07, ease: 'expo.out' })
      .to('.hero .hl', { backgroundSize: '100% 100%', duration: 0.7, ease: 'power2.inOut', onComplete: settleHero }, '-=0.35')
      .fromTo('.hero [data-anim]', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 }, '<-0.2')
      .fromTo('.stage__main', { autoAlpha: 0, y: 90, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: 'expo.out' }, '-=0.5')
      .fromTo('.mini', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12 }, '-=0.9');

    // Hero depth on scroll: the photo drifts, the cards rise at different speeds.
    const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.fromTo('.hero__bg > img', { scale: 1.08, yPercent: 0 }, { yPercent: 8, ease: 'none', scrollTrigger: heroST });
    gsap.to('.stage__main', { yPercent: -10, ease: 'none', scrollTrigger: heroST });
    gsap.to('.mini--left', { yPercent: -60, rotate: -4, ease: 'none', scrollTrigger: heroST });
    gsap.to('.mini--right', { yPercent: -90, rotate: 4, ease: 'none', scrollTrigger: heroST });

    // 2. The about statement fills in word by word as you scroll, and its key phrase gets a marker.
    const statement = document.querySelector('[data-scrub]');
    if (statement) {
      const words = SplitText.create(statement, { type: 'words' }).words;
      gsap.fromTo(words, { color: '#B8CC98' }, {
        color: '#032F14', ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: statement, start: 'top 90%', end: 'bottom 50%', scrub: 0.6 },
      });
      gsap.to(statement.querySelector('.hl--scrub'), {
        backgroundSize: '100% 100%', ease: 'none',
        scrollTrigger: { trigger: statement, start: 'top 60%', end: 'top 30%', scrub: 0.6 },
      });
    }

    // 3. Section headings: lines rise out of a mask, then any highlight sweeps in.
    document.querySelectorAll('[data-split]:not(.hero h1)').forEach((el) => {
      const split = roomy(SplitText.create(el, { type: 'lines', mask: 'lines' }));
      gsap.set(el, { autoAlpha: 1 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 96%', once: true }, onComplete: settle(el, split) });
      tl.from(split.lines, { yPercent: 105, duration: 0.8, stagger: 0.08, ease: 'expo.out' });
      const hl = el.querySelector('.hl');
      if (hl) tl.to(hl, { backgroundSize: '100% 100%', duration: 0.7, ease: 'power2.inOut' }, '-=0.45');
      const lead = el.parentElement.querySelector(':scope > .lead');
      if (lead) tl.from(lead, { autoAlpha: 0, y: 12, duration: 0.6, ease }, '-=0.6');
    });

    // 4. Single blocks fade up as they enter.
    document.querySelectorAll('[data-anim]:not(.hero [data-anim])').forEach((el) => {
      gsap.fromTo(el, { autoAlpha: 0, y: 24 }, {
        autoAlpha: 1, y: 0, duration: 0.7, ease, clearProps: 'transform',
        scrollTrigger: { trigger: el, start: 'top 98%', once: true },
      });
    });

    // 5. Card groups rise in sequence. clearProps hands the hover lift back to CSS afterwards.
    document.querySelectorAll('[data-stagger]').forEach((group) => {
      gsap.fromTo(group.children, { autoAlpha: 0, y: 28 }, {
        autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06, ease, clearProps: 'transform',
        scrollTrigger: { trigger: group, start: 'top 98%', once: true },
      });
    });

    // 6. The closing panel grows to full size as it arrives.
    gsap.fromTo('.final', { scale: 0.94 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.final', start: 'top 95%', end: 'top 45%', scrub: 0.6 },
    });

    // Re-measure once late images change the page height.
    addEventListener('load', () => ScrollTrigger.refresh());
  });
})();
