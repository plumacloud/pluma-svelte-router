import {writable, get} from 'svelte/store';
import {tick} from 'svelte';

export const currentRoute = writable(null);
export const currentPath = writable('');

let config = {};
const routerHistory = [];

// ROUTER INIT

export function initRouter (initialConfig) {
	config.routes = flattenRoutes(initialConfig.routes);

	// Reset the scroll position on route change
	config.resetScroll = initialConfig.resetScroll || true;

	// Route that will be used if no route is matched
	config.errorRoute = {
		path: '',
		components: [initialConfig.notFoundComponent]
	}

	history.scrollRestoration = 'manual';

	window.addEventListener('popstate', onPopState);
	window.addEventListener('scroll', saveScroll, {passive: true});

	push(getFullBrowserPath());
}

let timeoutId;

function saveScroll () {
	clearTimeout(timeoutId);
	timeoutId = setTimeout(() => {
		saveScrollPositionToCurrentHistoryItem();
	}, 250);
}

function flattenRoutes (routesTree, depth = 0) {
	const routes = [];

	routesTree.forEach((route) => {
		const flatRoute = {
			path: route.path || '',
			components: route.component ? [route.component] : route.components,
			blockPageScroll: route.blockPageScroll
		};

		// All paths should start with /
		if (flatRoute.path.charAt(0) !== '/') flatRoute.path = '/' + flatRoute.path;

		if (route.children) {
			const children = flattenRoutes(route.children, depth + 1);

			children.forEach((child, index) => {
				routes.push({
					path: child.path && child.path !== '/' ? flatRoute.path + child.path : flatRoute.path,
					components: [...flatRoute.components, ...child.components]
				});
			});
		} else {
			routes.push(flatRoute);
		}
	});

	// Only do this once when all routes have been flattened
	if (depth === 0) {
		routes.forEach((route) => {
			if (route.path.includes(':')) route.hasParams = true;
		});
	}

	return routes;
}

// UTILS

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
	for (let i = 0; i < config.routes.length; i++) {
		const route = config.routes[i];

		// If the path has parameters we need to check whether the segments match
		if (route.path.includes(':')) {
			const pathSegments = path.split('/');
			const routePathSegments = route.path.split('/');

			// If the number of segments doesn't match...
			if (pathSegments.length !== routePathSegments.length) continue;

			// Let's compare segment by segment...
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

function saveScrollPositionToCurrentHistoryItem () {
	const state = window.history.state;

	if (!state) return;

	state.scrollPosition = {
		x: window.scrollX,
		y: window.scrollY
	};

	window.history.replaceState(state, '', getFullBrowserPath());
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

function getCleanPath (fullPath) {
	let path = fullPath.split('#')[0];
	path = path.split('?')[0];
	return path;
}

function getFullBrowserPath () {
	return window.location.href.replace(window.location.origin, '');
}

function getQueryParamsFromPath (path) {
	if (!path.includes('?')) return {};

	path = path.split('#')[0];
	path = path.split('?')[1];

	const segments = path.split('&');
	const params = {};

	segments.forEach((segment) => {
		const pair = segment.split('=');
		const paramName = decodeURIComponent(pair[0]);
		const value = decodeURIComponent(pair[1]);
		params[paramName] = value;
	});

	return params;
}

// NAVIGATION

export async function push (options) {

	if (typeof options === 'string') {
		options = {
			path: options
		}
	}

	const fullPath = options.path;

	// Save the scroll position to the current history item
	// we're going to leave behind after pushing
	saveScrollPositionToCurrentHistoryItem();

	// Find the route from a path
	const cleanPath = getCleanPath(fullPath);
	const route = getRouteFromPath(cleanPath);
	const params = route.hasParams ? getParamsFromPath(cleanPath, route.path) : {};
	const query = getQueryParamsFromPath(fullPath);

	// Trigger updates on the UI
	currentPath.set(route.path);
	currentRoute.set({...route, params, query});

	// Wait until UI has updated
	await tick();

	if (route.blockPageScroll) blockPageScroll();
	else unblockPageScroll();

	// If the route doesn't block page scroll
	// And the router is configured to reset scroll on navigation
	// And the Link is not blocking the scroll to reset...
	if (route.blockPageScroll !== true && config.resetScroll && options.resetScroll !== false) {
		const scrollPosition = options.scrollToId ? getScrollPositionById(options.scrollToId) : {x: 0, y: 0};
		if (scrollPosition) setScroll(scrollPosition);
	}

	// Create a new history state
	const historyState = {
		blockPageScroll: route.blockPageScroll
	}

	if (options.scrollToId) {
		historyState.scrollToId = options.scrollToId;
	}

	window.history.pushState(historyState, '', fullPath);
}

export function back () {
	saveScrollPositionToCurrentHistoryItem();
	window.history.back();
}

async function onPopState (event) {

	// We don't want to do anything on a hash change
	if (event.state === null) {
		event.preventDefault();
		return;
	}

	const historyState = event.state;
	const fullPath = getFullBrowserPath();
	const cleanPath = getCleanPath(fullPath);
	const route = getRouteFromPath(cleanPath);
	const params = route.hasParams ? getParamsFromPath(cleanPath, route.path) : {};
	const query = getQueryParamsFromPath(fullPath);

	// Trigger updates on the UI
	currentPath.set(route.path);
	currentRoute.set({...route, params, query});

	await tick();

	if (route.blockPageScroll) blockPageScroll();
	else unblockPageScroll();

	if (historyState.scrollPosition || historyState.scrollToId) {
		const scrollPosition = historyState.scrollToId ? getScrollPositionById(historyState.scrollToId) : historyState.scrollPosition;
		if (scrollPosition) setScroll(scrollPosition);
	}
}

// QUERY PARAMS

export function addQueryParamsToUrl (params) {
	// Generate the query string
	const queryString = Object.keys(params).map((key) => `${key}=${params[key]}`).join('&');
	const fullPath = get(currentPath) + '?' + queryString;

	// Replace the history
	const state = window.history.state;
	window.history.replaceState(state, '', fullPath);
}