import { Cubic, gsap } from 'gsap';

const tweenMap = new Map<gsap.TweenTarget, gsap.core.Tween>();

export const animateCards = () => {
    const enter = (target: gsap.TweenTarget, done?: () => void) => {
        if (isReducedMotion()) return done?.();

        gsap.set(target, { opacity: 1, scale: 1, filter: 'blur(0)' });
        return gsap.from(target, {
            opacity: 0,
            filter: 'blur(0.25rem)',
            scale: 0.95,
            duration: 0.15,
            ease: Cubic.easeOut,
            onComplete: done,
        });
    };

    const leave = (target: gsap.TweenTarget, done?: () => void) => {
        if (isReducedMotion()) return done?.();

        gsap.set(target, { opacity: 1, scale: 1, filter: 'blur(0)' });
        return gsap.to(target, {
            opacity: 0,
            filter: 'blur(0.25rem)',
            scale: 0.95,
            duration: 0.15,
            ease: Cubic.easeOut,
            onComplete: done,
        });
    };

    const all = (id: string, target: gsap.TweenTarget, done?: () => void) => {
        if (isReducedMotion()) return;

        const tween = tweenMap.get(id);
        if (tween) tween.kill();

        gsap.set(target, { opacity: 1, x: 0, filter: 'blur(0)' });

        tweenMap.set(
            id,
            gsap.from(target, {
                opacity: 0,
                x: -10,
                filter: 'blur(0.25rem)',
                duration: 0.3,
                stagger: 0.1,
                ease: Cubic.easeOut,
                onComplete: () => {
                    tweenMap.delete(id);
                    done?.();
                },
            }),
        );
    };

    return {
        enter,
        leave,
        all,
    };
};
