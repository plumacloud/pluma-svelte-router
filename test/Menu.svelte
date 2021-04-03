<script>
	import Link from '../Link.svelte';
</script>

<ul class="nav nav-tabs mb-4">
	<li class="nav-item">
		<Link class="nav-link" path="/">Home</Link>
	</li>
	<li class="nav-item">
		<Link class="nav-link" path="/about">About</Link>
	</li>
	<li class="nav-item">
		<Link class="nav-link" path="/nested">Nested</Link>
	</li>
	<li class="nav-item">
		<Link class="nav-link" path="/something">Doesn't exist</Link>
	</li>
</ul>