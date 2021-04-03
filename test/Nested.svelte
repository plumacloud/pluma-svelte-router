<script>
	import Link from '../Link.svelte';
</script>

<h2 id="nested-title">Nested</h2>
<p class="mb-4">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Saepe, atque, itaque. Minima nulla nostrum, voluptates temporibus reprehenderit ullam eaque voluptas maxime beatae, ratione nisi qui amet, in voluptatem aspernatur. Voluptatum.</p>

<ul class="nav nav-tabs mb-4">
	<li class="nav-item">
		<Link class="nav-link" path="/nested/child-a" scrollToId="nested-title">Child A</Link>
	</li>
	<li class="nav-item">
		<Link class="nav-link" path="/nested/child-b" resetScroll={false}>Child B</Link>
	</li>
</ul>


<slot name="route-child"></slot>