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

This example is taken from the [demo app](../test-app/router.js).

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
```

Paths can have parameters:
```js
{ path: '/products/:productId', component: ProductDetail }
```

These will be available in the `params` object of the `currentRoute` store:

```svelte
<script>
	import {currentRoute} from 'pluma-svelte-router';
	console.log($currentRoute.params);
</script>
```


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

This feature is useful for using components as layouts, or when integrating modals with the router. For example, when you want deep linking on modals, or you'd like a modal to close when pressing back:

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

See the [demo app](../test-app/components/About.svelte) for an example on using modals.

## Links

You can use standard HTML links which will trigger router changes by using the `link` action.

```svelte
<script>
  import {link} from 'pluma-svelte-router';
</script>

<!-- Simple navigation -->
<a href="/about" use:link>About</a>

<!-- Navigate without scrolling to the top -->
<a href="/some/nested/path" use:link={{scrollToTop: false}}>Some tab section</a>

<!-- Navigate and then scroll to an element with an id -->
<a href="/user/settings" use:link={{scrollToId: 'password-form'}}>Set your password</a>
```

### Active link behavior
To highlight an active link use the `active` action.

By default, this will add the `active` CSS class to the element, but you can configure it to use a different class.

```svelte
<script>
  import {link, active} from 'pluma-svelte-router';
</script>

<!-- Will mark as active if the router is on /about -->
<a href="/about" use:link use:active>About</a>

<!-- Use a custom CSS class -->
<a href="/about" use:link use:active={{class: 'is-active'}}>About</a>

<!-- Mark as active if the href also matches the start of the current path eg: /products/123456/reviews -->
<a href="/products" use:link use:active={{matchStart: true}}>Products</a>
```

## Programmatic navigation

To go back and forward you can simply do:

```js
// Go back
window.history.back();

// Go forward
window.history.forward();
```

### `navigate()`

To navigate to a new route use the `navigate()` function:

```js
import {navigate} from 'pluma-svelte-router';

// You can simply use a path
navigate('/about');

// Navigate but replace current history item instead of pushing a new route
navigate({
  path: '/about',
  replace: true
});

// Navigate and don't scroll to the top
navigate({
  path: '/about',
  scrollToTop: false
});

// Navigate and scroll to an id
navigate({
  path: '/user/settings',
  scrollToId: 'password-form'
});
```

## Scrolling

By default, every route change will reset the scroll to the top left of the page. This can be avoided in three ways:

1. Setting `scrollToTop` to `false` on the initial configuration of the router.
2. Using `scrollToTop={false}` on a `<Link>`.
3. Setting `blockPageScroll` to `true` on a route configuration which will remove the scroll when rendering the route.

Scroll position is restored when going back and forward.

### How to enable or disable smooth scrolling?
This router is agnostic to the scrolling behavior. You should respect a user's [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) setting via CSS. See [how Boostrap does it](https://github.com/twbs/bootstrap/blob/644afc276169fd94ee2e6c5c79df8337be1b12ed/scss/_reboot.scss#L28-L36) for example.

## Query string parameters

If there are querystring parameters in the URL, you will be able to read them from the `query` object of the `currentRoute` store:

```svelte
<script>
  import {currentRoute} from 'pluma-svelte-router';
  console.log($currentRoute.query);
</script>
```

You can also set parameters to the URL without triggering a page change by using the `addQueryParamsToUrl` utility function:

```svelte
<script>
import {addQueryParamsToUrl} from 'pluma-svelte-router';

function addParams () {
  addQueryParamsToUrl({
    name: 'Pepito',
    food: 'tacos'
    });
  }
</script>

<button type="button" on:click={addParams}>Add params to query string</button>
```

## API
### Router configuration options

* `notFoundComponent` a component reference that will be rendered if there are no matched routes.
* `scrollToTop` determines if the scroll should be set to the top left when transitioning to a new route. The default is `true`.
* `manageScroll` if set to `false` all scrolling features of the router will be ignored. The default is `true`.

### Route configuration options
* `path` the path of the route
* `component` the component that will be rendered when the path is matched
* `components` the component tree that will be rendered when the path is matched
* `children` an array of children routes
* `blockPageScroll` whether to removing the scrolling capability of the `body` element by setting `overflow: hidden;`

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