<script>
	import {currentPath, push} from './index.js';
	export let path, activeClass = 'active', resetScroll = true, scrollToId, role, id;

	let classes;
	export {classes as class};

	let href;
	let cssClasses = classes || '';

	$: {
		href = path;
		if (href.charAt(0) !== '/' && !href.startsWith('#/')) href = '/' + href;
		if (href.charAt(0) !== '#') href =  '#' + href;

		const isActive = $currentPath === path || (path !== '/' && $currentPath.startsWith(path));

		if (isActive) cssClasses = classes ? classes + ' ' + activeClass : activeClass;
		else cssClasses = classes;
	}

	function onClick (event) {
		push({
			path,
			resetScroll,
			scrollToId
		});
	}

</script>

<a {href} class={cssClasses} on:click|preventDefault={onClick} {role} {id}><slot></slot></a>