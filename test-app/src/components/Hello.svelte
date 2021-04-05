<script>
	import {currentRoute} from 'pluma-svelte-router';
</script>

<h1>Hello {$currentRoute.params.name} !</h1>