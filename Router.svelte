<script>
	import Route from './Route.svelte';
	import {currentRoute, initRouter} from './index.js';

	export let config;

	initRouter(config);
</script>

{#if $currentRoute}
	<Route components={$currentRoute.components}></Route>
{/if}