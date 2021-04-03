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

	// Component that will be used if no route is matched
	config.errorRoute = {
		components: [initialConfig.notFoundComponent]
	}

	push(config.routes[0].path);
}

function flattenRoutes (routesTree) {
	const routes = [];

	routesTree.forEach((route) => {
		const flatRoute = {
			path: route.path,
			components: route.component ? [route.component] : route.components
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

window.addEventListener('popstate', onPopState);

// UTILS

function getHistoryItemById (id) {
	return routerHistory.find((item) => item.id === id);
}

function setScroll ({x, y, mode}) {
	window.scrollTo({
		top: y,
		left: x
	});
}

function scrollToId (id) {
	const element = document.getElementById(id);
	if (element) element.scrollIntoView(true);
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

// NAVIGATION

export async function push (request) {

	if (typeof request === 'string') {
		request = {
			path: request
		}
	}

	const route = getRouteFromPath(request.path);

	// Trigger updates on the UI
	currentPath.set(request.path);
	currentRoute.set(route);

	await tick();

	const historyState = {
		id: Date.now(),
		path: request.path
	}

	if (request.scrollToId) {
		historyState.scrollToId = request.scrollToId;
	} else {
		historyState.scrollPosition = {
			x: window.scrollX,
			y: window.scrollY
		}
	}

	routerHistory.push(historyState);

	window.history.pushState(historyState, '', request.path);

	if (config.resetScroll && request.resetScroll !== false) {
		if (request.scrollToId) {
			scrollToId(request.scrollToId);
		} else {
			setScroll({x: 0, y: 0});
		}
	}
}

async function onPopState (event) {
	const id = event.state.id;
	const historyItem = getHistoryItemById(id);

	if (!historyItem) return;

	const route = getRouteFromPath(historyItem.path);

	// Trigger updates on the UI
	currentPath.set(historyItem.path);
	currentRoute.set(route);

	await tick();

	if (historyItem.scrollPosition) setScroll({x: 0, y: 0});
	if (historyItem.scrollToId) scrollToId(historyItem.scrollToId);
}