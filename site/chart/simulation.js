import {
	forceSimulation, forceManyBody, forceX, forceY,
	forceCollide, forceLink, select
} from "d3"
import {
	nodes, links, linkGroup, text, node
} from "./elements.js"
import { getLinkCounts, clampToBoundary } from "./utilities.js"
import render from "./render.js"
import attractGroups from "./calculations/attract-groups.js"
import shapeLinks from "./calculations/shape-links.js"

const {
	chartBoundary,
	alphaCutoff,
	positionalForce,
	chargeStrength,
	collisionStrength,
	linkDistance,
	linkStrength,
	groupLinkStrength,
	groupChargeStrength,
	groupDistanceCutoff,
	groupDistanceCutoffSpeed,
} = {
	chartBoundary: 300,
	alphaCutoff: 0.3,
	positionalForce: {
		x: 0,
		y: 0,
	},
	chargeStrength: {
		initial: -100,
		final: -10,
	},
	collisionStrength: {
		initial: 0,
		final: 0,
	},
	linkDistance: {
		initial: 0.1,
		final: 1,
	},
	linkStrength: {
		initial: 0.2,
		final: 0.9,
	},
	groupLinkStrength: {
		initial: 1,
		final: 0.2,
	},
	groupChargeStrength: 0,
	groupDistanceCutoff: 5,
	groupDistanceCutoffSpeed: 100,
}

const linkCounts = getLinkCounts(links)
const simulation = getSimulation({ nodes, links })
runSimulation(simulation)
render({ linkGroup, node, text, linkCounts })

// Restart on resize
select(window).on("resize", () => {
	simulation.restart()
	render({ linkGroup, node, text, linkCounts })
})

function getSimulation({ nodes, links }) {
	const forces = {
		charge: forceManyBody()
			.strength(chargeStrength.initial),
		x: forceX(positionalForce.x),
		y: forceY(positionalForce.y),
		collision: forceCollide(collisionStrength.initial),
		link: forceLink()
			.id(({ id }) => id)
			.distance(linkDistance.initial)
			.strength(({ source, target }) => (
				source.group === target.group
					? groupLinkStrength.initial
					: linkStrength.initial
			)),
	}

	return forceSimulation()
		.nodes(nodes)
		.force("charge", forces.charge)
		.force("x", forces.x)
		.force("y", forces.y)
		.force("collision", forces.collision)
		.force("link", forces.link.links(links))
		.stop()
}

function runSimulation(simulation) {
	let count = 300
	while (count > 0) {
		simulation.tick()
		ticked()
		count--
	}
}

function ticked() {
	const nodes = simulation.nodes()
	const alpha = simulation.alpha()

	attractGroups(nodes, alpha, {
		alphaCutoff,
		groupChargeStrength,
		groupDistanceCutoff,
		groupDistanceCutoffSpeed,
	})
	clampToBoundary(nodes, chartBoundary)
	shapeLinks(simulation, alpha, {
		alphaCutoff,
		chargeStrength: chargeStrength.final,
		collisionStrength: collisionStrength.final,
		linkDistance: linkDistance.final,
		linkStrength: linkStrength.final,
	})
}
