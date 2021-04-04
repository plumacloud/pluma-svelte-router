<script>
	import {Link} from 'pluma-svelte-router';
</script>

<h1>Nested</h1>
<p class="mb-4">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Saepe, atque, itaque. Minima nulla nostrum, voluptates temporibus reprehenderit ullam eaque voluptas maxime beatae, ratione nisi qui amet, in voluptatem aspernatur. Voluptatum.</p>

<ul id="tab-menu" class="nav nav-tabs mb-4">
	<li class="nav-item">
		<Link class="nav-link" path="/nested/child-a" resetScroll={false}>Child A</Link>
	</li>
	<li class="nav-item">
		<Link class="nav-link" path="/nested/child-b" resetScroll={false}>Child B</Link>
	</li>
</ul>


<slot name="route-child"></slot>