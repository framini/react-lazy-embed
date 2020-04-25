import React from 'react';

import { LazyEmbed } from '../src';

export default {
  title: 'Lazy Embed',
};

export const responsiveIframe = () => (
  <div>
    <div
      style={{
        height: '200vh',
        width: '600px',
        marginBottom: '20px',
        background: '#2196f3',
      }}
    ></div>
    <div style={{ width: '600px' }}>
      <LazyEmbed id={'TWqFbKpV5Oc'}>
        {({ status, onActivate, iframe, thumbnail }) => {
          const showThumb = status === 'visible' || status === 'load';
          const showIframe = status === 'load' || status === 'loaded';

          return (
            <div
              style={
                showThumb
                  ? {
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      justifyContent: 'center',
                    }
                  : {}
              }
            >
              {showThumb && (
                <>
                  <picture>
                    <source srcSet={thumbnail.webp} type="image/webp" />
                    <img src={thumbnail.jpg} />
                  </picture>

                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(33, 150, 243, 0.25)',
                    }}
                  >
                    {status === 'load' ? (
                      <span>Loading</span>
                    ) : (
                      <button onClick={onActivate}>Load</button>
                    )}
                  </div>
                </>
              )}

              {showIframe && (
                <div
                  style={{
                    position: 'relative',
                    paddingBottom: '56.25%' /* 16:9 */,
                    paddingTop: 25,
                    height: 0,
                  }}
                >
                  <iframe
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                    }}
                    {...iframe}
                  />
                </div>
              )}
            </div>
          );
        }}
      </LazyEmbed>
    </div>
  </div>
);
