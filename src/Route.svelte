<script>
	export let components;
</script>

{#if components.length > 1}
	<svelte:component this={components[0]}>
		<svelte:self slot="route-child" components={components.slice(1)}/>
	</svelte:component>
{:else}
	<svelte:component this={components[0]}/>
{/if}