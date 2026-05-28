import { useEffect, useRef } from 'react';

const useInfiniteScroll = (callback) => {
  const observerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) callback();
      },
      { threshold: 0.5 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [callback]);

  return observerRef;
};

export default useInfiniteScroll;