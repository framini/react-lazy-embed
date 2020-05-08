# React Lazy Embed

React component for lazy loading heavy embeds like the one from YouTube. For now we only support YouTube videos but we might add support for Vimeo in the short term

</a><a href="https://bundlephobia.com/result?p=@framini/react-lazy-embed@latest" target="\_parent">
  <img alt="" src="https://badgen.net/bundlephobia/minzip/@framini/react-lazy-embed@latest" />
</a>

## Install

With Yarn

```
yarn install @framini/react-lazy-embed
```

With NPM

```
npm install @framini/react-lazy-embed
```

## How it works

The embed can be in 4 possible status, `'idle' | 'visible' | 'load' | 'loaded'`.

- `idle`: By default it will always starts as `idle` (in the future we might support an `eager` mode).
- `visible`: Once the embed is within the threshold (by default 200px) it will change it's status to `visible`. Here is where you can show the video thumbnail and a "play" button. Once the "play" button is pressed `status` will change to `load`.
- `load`: While the `status = load` you can safely show the embed (and a loading indicator if you feel like).
- `loaded`: When the iframe has been fully loaded.

## Example

You can play around with it by running `StoryBook`.

```
yarn storybook
```
