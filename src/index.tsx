import React, { ReactNode } from 'react';

const isBrowser = typeof window !== `undefined`;

// This is non-standard as the time of writing (20-04-2020) is not
// recommended to use it. Leaving it just so it's easy to activate in
// the future
// @see: https://web.dev/native-lazy-loading/
// const hasNativeLazyLoadSupport =
//   typeof HTMLIFrameElement !== `undefined` &&
//   `loading` in HTMLIFrameElement.prototype;
const hasNativeLazyLoadSupport = false;

const hasIOSupport = isBrowser && window.IntersectionObserver;

let io: IntersectionObserver;
const listeners = new WeakMap();
const preconnections: string[] = [];

const getIO = () => {
  if (
    typeof io === `undefined` &&
    typeof window !== `undefined` &&
    window.IntersectionObserver
  ) {
    io = new window.IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (listeners.has(entry.target)) {
            const cb = listeners.get(entry.target);

            // Edge doesn't currently support isIntersecting, so also
            // test for an intersectionRatio > 0
            if (entry.isIntersecting || entry.intersectionRatio > 0) {
              io.unobserve(entry.target);
              listeners.delete(entry.target);
              cb();
            }
          }
        });
      },
      { rootMargin: `200px` }
    );
  }

  return io;
};

const listenToIntersections = (el: HTMLElement | null, cb: () => void) => {
  if (el === null) {
    return;
  }

  const observer = getIO();

  if (observer) {
    observer.observe(el);
    listeners.set(el, cb);
  }

  return () => {
    observer.unobserve(el);
    listeners.delete(el);
  };
};

const addPrefetch = (kind: string, url: string, as: string = '') => {
  const id = `${kind}-${url}-${as}`;

  if (preconnections.includes(id)) {
    return;
  } else {
    preconnections.push(id);
  }

  const linkElem = document.createElement('link');
  linkElem.rel = kind;
  linkElem.href = url;
  if (as) {
    linkElem.as = as;
  }
  linkElem.crossOrigin = 'true';

  document.head.append(linkElem);
};

const getThumbnails = ({
  provider,
  id,
}: {
  provider: LazyEmbedProvider;
  id: string;
}): {
  webp: string;
  jpg: string;
} => {
  if (provider === 'youtube') {
    return {
      webp: `https://i.ytimg.com/vi_webp/${id}/hqdefault.webp`,
      jpg: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  throw Error('getThumbnails wrong provider');
};

type LazyEmbedProvider = 'youtube';

// `idle`       -> the component is not visible yet
// `visible`    -> the component should be visible or within the threshold
// `load`       -> the user has clicked on `onActive` and we should load the embed
// `loaded`     -> the embed has been successfully loaded
type LazyEmbedStatus = 'idle' | 'visible' | 'load' | 'loaded';

const useLazyEmbed = () => {
  // `firstLoad` is just a safeguard to avoid rendering different
  // things on the server/client
  const [firstLoad, setFirstLoad] = React.useState(true);

  const useIOSupport = !hasNativeLazyLoadSupport && hasIOSupport;

  const initialIsVisible =
    !firstLoad && (hasNativeLazyLoadSupport || !useIOSupport);

  const initialStatus = initialIsVisible ? 'visible' : 'idle';

  const [status, setStatus] = React.useState<LazyEmbedStatus>(initialStatus);

  React.useEffect(() => {
    setFirstLoad(false);
  }, []);

  return { status, useIOSupport, setStatus };
};

const getIframeProps = (props: Pick<LazyEmbedProps, 'id' | 'provider'>) => {
  if (props.provider === 'youtube') {
    return {
      frameBorder: '0',
      allow:
        'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture',
      allowFullScreen: true,
      src: `https://www.youtube-nocookie.com/embed/${props.id}`,
    };
  }

  return {
    frameBorder: '',
    allow: '',
    allowFullScreen: true,
    src: '',
  };
};

const noscriptImg = (props: Omit<LazyEmbedProps, 'children'>) => {
  if (props.provider === 'youtube') {
    const embedProps = getIframeProps({
      id: props.id,
      provider: props.provider,
    });

    return `<iframe frameborder="${embedProps.frameBorder}" allow="${embedProps.allow}" allowfullscreen="${embedProps.allowFullScreen}" src="${embedProps.src}"></iframe>`;
  }

  return '';
};

interface IframeProps {
  frameBorder: string;
  allow: string;
  allowFullScreen: boolean;
  src: string;
  onLoad: (event: React.SyntheticEvent<HTMLIFrameElement, Event>) => void;
}

interface LazyEmbedChildProps {
  status: LazyEmbedStatus;
  onActivate: () => void;
  iframe: IframeProps;
  thumbnail: ReturnType<typeof getThumbnails>;
}

export type LazyEmbedProps = {
  id: string;
  children: (props: LazyEmbedChildProps) => ReactNode;
  provider?: 'youtube';
};

export const LazyEmbed = ({
  id,
  children,
  provider = 'youtube',
}: LazyEmbedProps) => {
  const elRef = React.useRef<HTMLDivElement>(null);
  const [shouldPreconnect, setShouldPreconnect] = React.useState(false);
  const preconnectedRef = React.useRef(false);

  const { status, useIOSupport, setStatus } = useLazyEmbed();

  const onActivate = React.useCallback(() => {
    setStatus('load');
  }, []);

  React.useEffect(() => {
    // If the browser doesn't support IntersectionObserver then
    // there's nothing else to do here
    if (useIOSupport) {
      const cleanupListeners = listenToIntersections(elRef.current, () => {
        setStatus('visible');
      });

      return () => {
        cleanupListeners && cleanupListeners();
      };
    }

    return;
  }, [setStatus, useIOSupport]);

  // Warm up the connection before loading the embed
  React.useEffect(() => {
    if (
      shouldPreconnect &&
      !preconnectedRef.current &&
      provider === 'youtube'
    ) {
      addPrefetch('preconnect', 'https://www.youtube-nocookie.com');
      addPrefetch('preconnect', 'https://www.google.com');

      preconnectedRef.current = true;
    }
  }, [shouldPreconnect, provider]);

  const onIframeLoad = React.useCallback(() => {
    setStatus('loaded');
  }, []);

  const iframeProps = React.useMemo(() => {
    return {
      ...getIframeProps({ provider, id }),
      onLoad: onIframeLoad,
    };
  }, [id, provider]);

  const thumbnailProps = React.useMemo(() => {
    return getThumbnails({ provider, id });
  }, [provider, id]);

  const onPointerOver = () => {
    if (status !== 'loaded' && !preconnectedRef.current) {
      setShouldPreconnect(true);
    }
  };

  return (
    <div ref={elRef} onPointerOver={onPointerOver}>
      {children({
        status,
        onActivate,
        iframe: iframeProps,
        thumbnail: thumbnailProps,
      })}

      <noscript
        dangerouslySetInnerHTML={{
          __html: noscriptImg({ id, provider }),
        }}
      />
    </div>
  );
};
