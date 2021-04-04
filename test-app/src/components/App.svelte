<script>
	import Menu from './Menu.svelte';
	import {Router} from 'pluma-svelte-router';
	import routerConfig from '../router.js';
</script>

<Menu/>

<div style="padding-top: 4rem;">
	<Router config={routerConfig}/>
</div>