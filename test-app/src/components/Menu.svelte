<script>
	import {Link} from 'pluma-svelte-router';
</script>

<nav class="navbar navbar-expand navbar-dark bg-primary fixed-top">
	<div class="container-fluid">
		<ul class="navbar-nav">
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
	</div>
</nav>