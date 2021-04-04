import Home from './Home.svelte';
import About from './About.svelte';
import Modal from './Modal.svelte';
import Error from './Error.svelte';
import Nested from './Nested.svelte';
import ChildA from './ChildA.svelte';
import ChildB from './ChildB.svelte';
import GrandchildA from './GrandchildA.svelte';

export default {
	notFoundComponent: Error,
	routes: [
		{ path: '/', component: Home },
		{ path: '/about', component: About },
		{ path: '/about/some-modal', components: [About, Modal], blockPageScroll: true },
		{
			path: '/nested',
			component: Nested,
			children: [
				{
					path: 'child-a',
					component: ChildA,
					children: [
						{ path: 'grandchild-a', component: GrandchildA }
					]
				},
				{ path: 'child-b', component: ChildB }
			]
		}
	]
};