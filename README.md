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
{
  notFoundComponent: Error,
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/about/some-modal', components: [About, Modal], blockPageScroll: true },
    { path: '/hello/:name', component: Hello },
    {
      path: '/nested',
      component: Nested,
      children: [
        { component: DefaultChild },
        {
          path: 'child-a',
          component: ChildA,
          children: [
            {component: GrandchildA }
          ]
        },
        { path: 'child-b', component: ChildB }
      ]
    }
  ]
}
```
And will produce the following available paths:
```
/
/about
/about/some-modal
/hello/:name
/nested
/nested/child-a
/nested/child-b
```
## Configuring routes
The most basic route must have at least a `path` and a `component` reference:
```js
{ path: '/about', component: About }
````

### Nested routes
You can add nested routes using the `children` array:
```js
{
  path: '/characters',
  component: Characters,
  children: [
    { path: '/yoda', component: Yoda },
    { path: '/han-solo', component: HanSolo },
  ]
}
```
These routes will produce two available paths:
* `/characters/yoda`
* `/characters/han-solo`

The router will render child routes in the default slot of the parent component:
```svelte
// Characters.svelte
<h1>Star Wars Characters</h1>
<slot></slot>
```

It's possible to add a default first child without a path:

```js
{
  path: '/characters',
  component: Characters,
  children: [
    { component: CharacterList },
    { path: '/yoda', component: Yoda },
    { path: '/han-solo', component: HanSolo },
  ]
}
```
Now there will be three paths available:
* `/characters` which will render the default `CharacterList` inside `Characters`
* `/characters/yoda`
* `/characters/han-solo`


### Composing components on the router
Nested components can be composed right from the router by using the `components` array:

```js
{ path: '/some-path', components: [Parent, Child] }
````

Just as with nested routes, this will render the `Child` component in the default slot of the `Parent` component.

This feature is useful for layouts or when integrating modals with the router. For example, when you want deep linking on modals, or you'd like a modal to close when pressing back:

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

<Link path="/">Home</Link>
<Link class="nav-link" path="/about" scrollToTop={false}>About</Link>
```

### Active link behavior
By default, an `active` CSS class will be added to the rendered `<a>` tag if the `path` prop matches the full path of the current route:

```svelte
// Will be marked as active if the current path is /posts
<Link path="/posts">Posts</Link>
```

You might want the active class to be added if the path of the link only matches the start of the current path:
```svelte
// Will be marked as active on the /posts but also /posts/hello-world or /posts/anything/here paths
<Link path="/posts" matchStart={true}>Posts</Link>
```

You can add a custom active class with:
```svelte
<Link activeClass="is-active" path="/">Home</Link>
```

## Programmatic navigation

### `push()`

```js
// You can simply use a path
push('/about');

push({
    path: '/about',
    scrollToTop: false
});

push({
    path: '/users/something',
    scrollToId: 'tab-menu'
});
```

## Scrolling

By default, every route change will reset the scroll to the top left of the page. This can be avoided in three ways:

1. Setting `scrollToTop` to `false` on the initial configuration of the router.
2. Using `scrollToTop={false}` on a `<Link>`.
3. Setting `blockPageScroll` to `true` on a route configuration.

Scroll position is stored when going back and forward.

### How to enable or disable smooth scrolling?
This router is agnostic to the scrolling behavior. You should respect a user's [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) setting via CSS. See [how Boostrap does it](https://github.com/twbs/bootstrap/blob/644afc276169fd94ee2e6c5c79df8337be1b12ed/scss/_reboot.scss#L28-L36) for example.

## Query string parameters

If there are querystring parameters in the URL, you will be able to read them from the `currentRoute` store:

```svelte
<script>
	import {currentRoute} from 'pluma-svelte-router';
	const queryParams = $currentRoute.query;
	console.log(queryParams);
</script>
```

You can also set parameters to the URL without triggering a page change by using the `addQueryParamsToUrl` utility function:

```svelte
<script>
	import {addQueryParamsToUrl} from 'pluma-svelte-router';

	function addParams () {
		addQueryParamsToUrl({
			name: 'Pepito',
			food: 'tacos',
			age: 33
		});
	}

</script>

<button type="button" on:click={addParams}>Add params to query string</button>
```

## API
### Router configuration options

* `notFoundComponent` a component reference that will be rendered if there are no matched routes.
* `scrollToTop` determines if the scroll should be set to the top left when transitioning to a new route. The default is `true`.

### Route configuration options
* `path` the path of the route
* `component` the component that will be rendered when the path is matched
* `components` the component tree that will be rendered when the path is matched
* `children` an array of children routes
* `blockPageScroll` whether to removing the scrolling capability of the `body` element by setting `overflow: hidden;`

### `Link` component props

* `path` the router path that will be triggered.
* `activeClass` the CSS class that will be applied is the `Link` is deemed to be active. By default the CSS class is `active`.
* `scrollToTop` determines whether the router should scroll to the top left of the page when navigating. The default is `true`.
* `scrollToId` determines if the router should scroll to an element with a particular `id` after transitioning to the next page. The router will try to center the element in the center of the viewport.

Common HTML attributes will be applied to the `<a>` tag: `class`, `role`, `id`.

## FAQ

## Roadmap

Features that will be implemented in the not-so-distant future:

* Route data cache
* Hooks

Features that will be implemented for the `1.0.0` release:

* TypeScript
* Code splitting

Features that will not be implemented:

* Nested routers