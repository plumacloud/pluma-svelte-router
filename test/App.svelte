<script>
	import Menu from './Menu.svelte';
	import Router from '../Router.svelte';
	import routerConfig from './router-config.js';
</script>

<h1 class="mb-4">My App</h1>
<Menu/>
<Router config={routerConfig}/>