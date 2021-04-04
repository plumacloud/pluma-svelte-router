<script>
	import Menu from './Menu.svelte';
	import Router from '../Router.svelte';
	import routerConfig from './router-config.js';
</script>

<Menu/>

<div style="padding-top: 4rem;">
	<Router config={routerConfig}/>
</div>