# PLUMA Svelte Router

This is a client-side router that uses history mode. It's not even a `0.0.1` release so expect bugs, changes, and dragons.

It's not published on NPM yet but will be at in the coming weeks.

To test it out, clone this repo and do `npm install && npm run dev-test-app`.

## Basic usage:

```svelte
<script>
  import Router from 'pluma-svelte-router';

  import Home from './Home.svelte';
  import About from './About.svelte';
  import Contact from './Contact.svelte';
  import Error from './Error.svelte';

  const config = {
    notFoundComponent: Error,
    routes: [
      { path: '/', component: Home },
      { path: '/about', component: About },
      { path: '/contact', component: Contact }
    ]
  }
</script>

<Router {config}/>
```

## Configuring routes
The most basic route must have at least a `path` and a `component` reference:
```js
{ path: '/about', component: About }
````

### Nested routes
You can add nested routes using the `children` array.
```js
{
  path: '/posts',
  component: Posts,
  children: [
    // The path of the first child is optional as it will be rendered at /posts
    { component: LatestPosts }
    // Will be available at /posts/hello-world
    { path: '/hello-world', component: HelloWorld }
  ]
}
```

When accessing a parent route, the first child will always be rendered. In the previous example, the `LatestPosts` component will always be rendered when accessing the `/posts` path.

If the first child does have a `path`, it will be available in both the parent path and its own path:
```js
{
  path: '/posts',
  component: Posts,
  children: [
    // Will be rendered at /posts and /posts/hello-world
    { path: '/hello-world', component: HelloWorld }
  ]
}
```

To disable this behavior use set the `renderFirstChild` option `false` on the router or the parent route.

To tell the router where to render child routes, you need to add a `route-child` slot on the parent component:
```svelte
// Posts.svelte
<h1>My posts</h1>
<slot name="route-child"></slot>
```


### Nested components in a single route
It's also possible to compose nested components right from the router by doing:

```js
{ path: '/some-path', components: [Parent, Child] }
````

This will render the `Child` component in the `route-child` slot of the `Parent` component.

This is useful, for example, when you want deep linking on modals, or you'd like a modal to close when pressing back. For example:

```js
// Login modal
{ path: '/home', components: [Home] },
{ path: '/home/login', components: [Home, LoginModal] }

// Picture modal
{ path: '/photos', components: [Photos] },
{ path: '/photos/:photoId', components: [Photos, PhotoDetailModal] }
````

## The `Link` component
A simple link with a hash will suffice in many cases to trigger a navigation change:
```html
<a href="#/about">About</a>
```
This has a couple of limitations though:

1. The link will be missing a CSS class to determine an active route
2. You can't control the scrolling behavior of the router

To overcome those limitations, you can simply use the `Link` component:

```svelte
<script>
  import Link from 'pluma-svelte-router';
</script>

<Link class="nav-link" path="/">Home</Link>
<Link class="nav-link" path="/about" resetScroll={false}>About</Link>
```

### Active link behavior
By default, an `active` CSS class will be added to the rendered `<a>` tag if the `path` prop matches the start or the full path of the current route.

For example, the following `Link` will be active if the current path is `/posts` and also `/posts/hello-world`:
```svelte
<Link path="/posts">Posts</Link>
```

You can add a custom active class with:
```svelte
<Link activeClass="is-active" path="/">Home</Link>
```

You can implement your custom active behavior by using the `currentPath` store:

```svelte
<script>
  import {currentPath} from 'pluma-svelte-router';
</script>


<a class:active={$currentPath === '/about'} href="#/about">About</a>
<a class:active={$currentPath.startsWith('/nested')} href="#/nested">Section with children</a>
<a class:active={$currentPath === '/nested/child' || $currentPath.endsWith('child')} href="#/nested/child">Child section</a>
```

## Programmatic navigation

### `push()`

```js
// just pass a path
push('/about');

push({
	path: '/about',
	resetScroll: false
});

push({
	path: '/users/something',
	scrollToId: 'tab-menu'
});
```


## API
### Router configuration options

* `notFoundComponent` a component reference that will be rendered if there are no matched routes.
* `renderFirstChild` determines if the first child of a parent route will be rendered by default. The default is `true`.
* `resetScroll` determines if the scroll should be set to `0,0` when transitioning to a new route. The default is `true`.

## FAQ

### How to enable or disable smooth scrolling?
This router does not support this feature to respect users that may have configured the "reduce motion" accesiblity setting on their OS.

## Roadmap

Features that will be implemented in the not-so-distant future:

* History
* Code splitting

Features that could be implemented if there's demand:

* TypeScript

Features that will not be implemented:

* Nested routers