# PLUMA Svelte Router

This is a client-side router that uses history mode. It's super early in developement so expect bugs, changes, and dragons.

Demo app: https://pluma-svelte-router-demo.netlify.app/

To install:
```
npm i pluma-svelte-router
```

To test it out, clone this repo and do `npm install && npm run dev-test-app`.

## Simple example

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

## More complex router config example

This example is taken from the [test-app](../test-app/router.js).

```js
import Home from './components/Home.svelte';
import About from './components/About.svelte';
import Modal from './components/Modal.svelte';
import Error from './components/Error.svelte';
import Nested from './components/Nested.svelte';
import ChildA from './components/ChildA.svelte';
import ChildB from './components/ChildB.svelte';
import GrandchildA from './components/GrandchildA.svelte';

export default {
  notFoundComponent: Error,
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/about/some-modal', components: [About, Modal], blockPageScroll: true },
    {
      path: '/nested',
      component: Nested,
      children: [
        {
          path: 'child-a',
          component: ChildA,
          children: [
            { path: 'grandchild-a', component: GrandchildA }
          ]
        },
        { path: 'child-b', component: ChildB }
      ]
    }
  ]
};
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

To tell the router where to render child routes, you need to add a default slot on the parent component:
```svelte
// Posts.svelte
<h1>My posts</h1>
<slot></slot>
```


### Composing components on the router
It's possible to compose nested components right from the router by doing:

```js
{ path: '/some-path', components: [Parent, Child] }
````

This will render the `Child` component in the default slot of the `Parent` component:

```svelte
// Parent.svelte
<slot></slot>
```

This feature is useful to use components as layouts or when integrating modals with the router. For example, when you want deep linking on modals, or you'd like a modal to close when pressing back:

```js
// Layout
{ path: '/home', components: [AppLayout, Shell, Home] },

// Picture modal
{ path: '/photos', components: [Photos] },
{ path: '/photos/:photoId', components: [Photos, PhotoDetailModal], blockPageScroll: true }

// Login modal
{ path: '/home', components: [Home] },
{ path: '/home/login', components: [Home, LoginModal], blockPageScroll: true }
````

See the [test-app](../test-app/components/About.svelte) for an example on using modals.

## The `Link` component
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


<a class:active={$currentPath === '/about'} href="/about">About</a>
<a class:active={$currentPath.startsWith('/nested')} href="/nested">Section with children</a>
<a class:active={$currentPath === '/nested/child' || $currentPath.endsWith('child')} href="/nested/child">Child section</a>
```

## Programmatic navigation

### `push()`

```js
// You can simply use a path
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
* `resetScroll` determines if the scroll should be set to `0,0` when transitioning to a new route. The default is `true`.

### Route configuration options
* `path` the path of the route
* `component` the component that will be rendered when the path is matched
* `components` the component tree that will be rendered when the path is matched
* `children` an array of children routes
* `blockPageScroll` whether to removing the scrolling capability of the `body` element by setting `overflow: hidden;`

### `Link` component props

* `path` the router path that will be triggered.
* `activeClass` the CSS class that will be applied is the `Link` is deemed to be active. By default the CSS class is `active`.
* `resetScroll` determines whether the router should scroll to the top left of the page when navigating. The default is `true`.
* `scrollToId` determines if the router should scroll to an element with a particular `id` after transitioning to the next page. The router will try to center the element in the center of the viewport.

Common HTML attributes will be applied to the `<a>` tag: `class`, `role`, `id`.

## FAQ

### How to enable or disable smooth scrolling?
This router does not support this feature to respect users that may have configured the "reduce motion" accesiblity setting on their OS.

## Roadmap

Features that will be implemented in the not-so-distant future:

* Route params
* Query strings
* Route data cache
* Allow click with modifiers
* Hooks

Features that will be implemented for the `1.0.0` release:

* TypeScript
* Code splitting

Features that will not be implemented:

* Nested routers