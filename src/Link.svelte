<script>
	import {currentPath, currentRoute, push} from './router.js';

	export let path;
	export let activeClass = 'active';
	export let resetScroll = true;
	export let scrollToId = null;
	export let role = '';
	export let id = '';
	export let matchStart = false;

	let classes;
	export {classes as class};

	let href;
	let cssClasses = classes || '';
	let isActive = false;

	$: {
		href = path;
		if (href.charAt(0) !== '/') href = '/' + href;

		// If the current route has params we need to determine
		// if the path of the link matches with the route path
		// ignoring the segments that are parameters

		if ($currentRoute && $currentRoute.hasParams) {
			const pathSegments = path.split('/');
			const routePathSegments = $currentRoute.path.split('/');

			if (!matchStart && pathSegments.length !== routePathSegments.length) {
				isActive = false;
			} else {
				isActive = true;

				// We're only traversing the segments of the link path
				// because it could be shorter than the full route path
				// and we want to mark the link as active if it matches
				// the first part

				for (let i = 1; i < pathSegments.length; i++) {
					if (routePathSegments[i].charAt(0) !== ':' && pathSegments[i] !== routePathSegments[i]) {
						isActive = false;
					}
				}
			}
		} else {
			isActive = $currentPath === path || (matchStart && path !== '/' && $currentPath.startsWith(path));
		}

		if (isActive) cssClasses = classes ? classes + ' ' + activeClass : activeClass;
		else cssClasses = classes;
	}

	function onClick (event) {

		// We ignore the click event if it has a modifier
		if (event.metaKey || event.ctrlKey || event.altKey || evet.shiftKey) return;

		event.preventDefault();

		push({
			path,
			resetScroll,
			scrollToId
		});
	}

</script>

<a {href} class={cssClasses} on:click={onClick} {role} {id}><slot></slot></a>