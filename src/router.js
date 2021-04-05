import {writable, get} from 'svelte/store';
import {tick} from 'svelte';

export const currentRoute = writable(null);
export const currentPath = writable('');

let config = {};
const routerHistory = [];
let currentHistoryIndex = null;

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
			blockPageScroll: route.blockPageScroll
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

	routes.forEach((route) => {
		if (route.path.includes(':')) route.hasParams = true;
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

function getHistoryItemIndexById (id) {
	return routerHistory.findIndex((item) => item.id === id);
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
	path = path.charAt(0) !== '/' ? '/' + path : path;

	for (let i = 0; i < config.routes.length; i++) {
		const route = config.routes[i];

		// If the path has parameters
		if (route.path.includes(':')) {
			const pathSegments = path.split('/');
			const routePathSegments = route.path.split('/');

			if (pathSegments.length !== routePathSegments.length) continue;

			console.log(pathSegments, routePathSegments);

			for (let j = 1; j < pathSegments.length; j++) {
				const isParam = routePathSegments[j].charAt(0) === ':';
				const isLast = j === pathSegments.length - 1;
				const segmentsMatch = pathSegments[j] === routePathSegments[j];
				const hasValue = pathSegments[j] !== '';

				if (!isParam && !segmentsMatch) break;

				if (isParam && !isLast) {
					if (hasValue) continue
					else break;
				}

				if (isLast && segmentsMatch || isLast && isParam && hasValue) return route;
			}
		} else if (route.path === path) {
			return route;
		}
	}

	// If we haven't matched a route we return the error route
	return config.errorRoute;
}

function blockPageScroll () {
	// console.log('blocking scroll');
	document.body.style.overflow = 'hidden';
}

function unblockPageScroll () {
	document.body.style.overflow = 'auto';
}

function saveScrollPositionToLastHistoryItem () {
	const lastHistoryItem = getLastHistoryItem();

	if (lastHistoryItem) {
		lastHistoryItem.scrollPosition = {
			x: window.scrollX,
			y: window.scrollY
		}
	}
}

function getParamsFromPath (path, routePath) {
	const pathSegments = path.split('/');
	const routePathSegments = routePath.split('/');
	const params = {};

	for (let i = 1; i < pathSegments.length; i++) {
		if (routePathSegments[i].charAt(0) === ':') {
			const paramName = routePathSegments[i].slice(1);
			console.log(paramName, pathSegments[i]);
			params[paramName] = pathSegments[i];
		}
	}

	return params;
}

// NAVIGATION

export async function push (options) {

	if (typeof options === 'string') {
		options = {
			path: options
		}
	}

	// If we're pushing and we're not on the last history item
	// we need to delete the following items in the history
	if (currentHistoryIndex !== null && currentHistoryIndex !== routerHistory.length - 1) {
		routerHistory.splice(currentHistoryIndex + 1);
	}

	saveScrollPositionToLastHistoryItem();

	// Find the route from a path
	const route = getRouteFromPath(options.path);
	const params = route.hasParams ? getParamsFromPath(options.path, route.path) : {};

	// Trigger updates on the UI
	currentPath.set(route.path);
	currentRoute.set({...route, params});

	await tick();

	if (route.blockPageScroll) blockPageScroll();
	else unblockPageScroll();

	// Determine the position to scroll to after the navigation
	let scrollPosition;

	// If the route doesn't block scroll
	// And the router is configured to reset scroll on navigation
	// And the Link is not blocking the scroll to reset...
	if (route.blockPageScroll !== true && config.resetScroll && options.resetScroll !== false) {
		scrollPosition = options.scrollToId ? getScrollPositionById(options.scrollToId) : {x: 0, y: 0};
		if (scrollPosition) setScroll(scrollPosition);
	}

	// Create a new history item
	const historyItem = {
		id: Date.now(),
		path: route.path,
		blockPageScroll: route.blockPageScroll
	}

	if (options.scrollToId) {
		historyItem.scrollToId = options.scrollToId;
	}

	// console.log({currentHistoryIndex});

	routerHistory.push(historyItem);
	currentHistoryIndex = routerHistory.length - 1;

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
	currentHistoryIndex = getHistoryItemIndexById(id);

	// console.log({currentHistoryIndex});
	// console.log(historyItem);

	if (!historyItem) return;

	const route = getRouteFromPath(historyItem.path);

	const params = route.hasParams ? getParamsFromPath(historyItem.path, route.path) : {};

	// Trigger updates on the UI
	currentPath.set(route.path);
	currentRoute.set({...route, params});

	await tick();

	if (route.blockPageScroll) blockPageScroll();
	else unblockPageScroll();

	if (historyItem.scrollPosition || historyItem.scrollToId) {
		const scrollPosition = historyItem.scrollToId ? getScrollPositionById(historyItem.scrollToId) : historyItem.scrollPosition;
		if (scrollPosition) setScroll(scrollPosition);
	}
}