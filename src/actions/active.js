import {get} from 'svelte/store';
import {currentRoute} from '../router.js';

const currentItems = [];

export default function (node, options = {}) {
	options.cssClass = options.class || 'active';
	options.matchStart = typeof options.matchStart === 'undefined' ? false : options.matchStart;

	const item = {node, options};
	currentItems.push(item);

	const route = get(currentRoute);
	if (route) setActiveClass(item, route);

	return {
		destroy () {
			// Delete the item when removed from the DOM
			const index = currentItems.findIndex((item) => item.node === node);
			currentItems.splice(index, 1);
		}
	}
}

function setActiveClass (item, route) {
	const linkPath = item.node.pathname;
	const {matchStart, cssClass} = item.options;

	let isActive = false;

	if (!route.hasParams) {
		isActive = linkPath === route.path || (matchStart && linkPath !== '/' && route.path.startsWith(linkPath));
	} else {
		// If the current route has params we need to determine
		// if the path of the link matches with the route path
		// ignoring the segments that are parameters

		const linkPathSegments = linkPath.split('/');
		const routePathSegments = route.path.split('/');

		if (!matchStart && linkPathSegments.length !== routePathSegments.length) {
			isActive = false;
		} else {
			isActive = true;

			// We're only traversing the segments of the link path
			// because it could be shorter than the full route path
			// and we may want to mark the link as active if it matches
			// the first part

			for (let i = 1; i < linkPathSegments.length; i++) {
				if (routePathSegments[i].charAt(0) !== ':' && linkPathSegments[i] !== routePathSegments[i]) {
					isActive = false;
				}
			}
		}
	}

	if (isActive) item.node.classList.add(cssClass);
	else item.node.classList.remove(cssClass);
}

currentRoute.subscribe((route) => {
	currentItems.forEach((item) => {
		setActiveClass(item, route);
	});
});