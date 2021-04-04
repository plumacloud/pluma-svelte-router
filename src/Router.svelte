<script>
	import Route from './Route.svelte';
	import {currentRoute, initRouter} from './router.js';

	export let config;

	initRouter(config);
</script>

{#if $currentRoute}
	<Route components={$currentRoute.components}></Route>
{/if}