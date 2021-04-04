import {writable, get} from 'svelte/store';
import {tick} from 'svelte';

export const currentRoute = writable(null);
export const currentPath = writable('');

let config = {};
const routerHistory = [];

// ROUTER INIT

export function initRouter (initialConfig) {
	config.routes = flattenRoutes(initialConfig.routes);

	// Render the first child of the parent route
	config.renderFirstChild = initialConfig.renderFirstChild || true;

	// Reset the scroll position on route change
	config.resetScroll = initialConfig.resetScroll || true;

	// Route that will be used if no route is matched
	config.errorRoute = {
		path: '',
		components: [initialConfig.notFoundComponent]
	}

	window.addEventListener('popstate', onPopState);
	history.scrollRestoration = 'manual';

	// push(config.routes[0].path);
	push(window.location.pathname);
}

function flattenRoutes (routesTree) {
	const routes = [];

	routesTree.forEach((route) => {
		const flatRoute = {
			path: route.path,
			components: route.component ? [route.component] : route.components,
			blockScroll: route.blockScroll
		};

		// All paths should start with /
		if (flatRoute.path.charAt(0) !== '/') flatRoute.path = '/' + flatRoute.path;

		if (route.children) {
			const children = flattenRoutes(route.children);

			const firstChild = children[0];

			routes.push({
				path: flatRoute.path,
				components: config.renderFirstChild ? flatRoute.components : [...flatRoute.components, ...firstChild.components]
			});

			children.forEach((child, index) => {

				// If the first child does not have a path
				// it will never be rendered on its own
				if (index === 0 && !child.path) return;

				routes.push({
					path: flatRoute.path + child.path,
					components: [...flatRoute.components, ...child.components]
				});
			});
		} else {
			routes.push(flatRoute);
		}
	});

	return routes;
}

// UTILS

function getHistoryItemById (id) {
	return routerHistory.find((item) => item.id === id);
}

function getLastHistoryItem () {
	return routerHistory[routerHistory.length - 1];
}

function setScroll ({x, y}) {
	window.scrollTo({
		top: y,
		left: x
	});
}

function getScrollPositionById (id) {
	const element = document.getElementById(id);

	if (element) {
		// Find the best scroll position to center the element on the viewport
		const rectangle = element.getBoundingClientRect();

		let scrollTop = rectangle.top - window.innerHeight / 2;
		let scrollLeft = rectangle.left - window.innerWidth / 2;

		const position = {
			x: scrollLeft < 0 ? 0 : scrollLeft,
			y: scrollTop < 0 ? 0 : scrollTop
		};

		return position;
	} else {
		throw `Element id "${id}" doesn't exist in the page`;
	}
}

function getRouteFromPath (path) {
	// Clean the path because paths on routes will always start with /
	path = path.charAt(0) === '#' ? path.slice(1) : path;
	path = path.charAt(0) !== '/' ? '/' + path : path;

	for (var i = 0; i < config.routes.length; i++) {
		const route = config.routes[i];
		if (route.path === path) return route;
	}

	// If we haven't matched a route we return the error route
	return config.errorRoute;
}

function blockScroll () {
	console.log('blocking scroll');
	document.body.style.overflow = 'hidden';
}

function unblockScroll () {
	document.body.style.overflow = 'auto';
}

function saveScrollPositionToLastHistoryItem () {
	const lastHistoryItem = getLastHistoryItem();

	if (lastHistoryItem) {
		lastHistoryItem.scrollPosition = {
			x: window.scrollX,
			y: window.scrollY
		}

		console.log(lastHistoryItem);
	}
}

// NAVIGATION

export async function push (options) {

	if (typeof options === 'string') {
		options = {
			path: options
		}
	}

	saveScrollPositionToLastHistoryItem();

	// Find the route from a path
	const route = getRouteFromPath(options.path);

	// Trigger updates on the UI
	currentPath.set(route.path);
	currentRoute.set(route);

	await tick();

	if (route.blockScroll) blockScroll();
	else unblockScroll();

	// Determine the position to scroll to after the navigation
	let scrollPosition;

	// If the route doesn't block scroll
	// And the router is configured to reset scroll on navigation
	// And the Link is not blocking the scroll to reset...
	if (route.blockScroll !== true && config.resetScroll && options.resetScroll !== false) {
		scrollPosition = options.scrollToId ? getScrollPositionById(options.scrollToId) : {x: 0, y: 0};
		if (scrollPosition) setScroll(scrollPosition);
	}

	// Create a new history item
	const historyItem = {
		id: Date.now(),
		path: route.path,
		blockScroll: route.blockScroll
	}

	if (options.scrollToId) {
		historyItem.scrollToId = options.scrollToId;
	}

	routerHistory.push(historyItem);

	window.history.pushState({id: historyItem.id}, '', options.path);
}

export function back (options) {
	if (options.fallbackPath && routerHistory.length === 1) {
		console.log('fallback!', routerHistory.length);
		push(options.fallbackPath);
	} else {
		console.log('going back!');
		saveScrollPositionToLastHistoryItem();
		window.history.back();
	}
}

async function onPopState (event) {
	// Find the history item by using the id
	const id = event.state.id;
	const historyItem = getHistoryItemById(id);

	// console.log(historyItem);

	if (!historyItem) return;

	const route = getRouteFromPath(historyItem.path);

	// Trigger updates on the UI
	currentPath.set(route.path);
	currentRoute.set(route);

	await tick();

	if (route.blockScroll) blockScroll();
	else unblockScroll();

	if (historyItem.scrollPosition || historyItem.scrollToId) {
		const scrollPosition = historyItem.scrollToId ? getScrollPositionById(historyItem.scrollToId) : historyItem.scrollPosition;
		if (scrollPosition) setScroll(scrollPosition);
	}
}