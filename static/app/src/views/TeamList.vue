<template>
<div class="container">
	<div class="row">
		<div class="col">
		<h1 id="teamName">{{ team.name }}</h1>
			<table class="table table-striped">
			<thead>
				<tr>
					<th scope="col">&nbsp;</th>
					<th scope="col">Agent</th>
					<th scope="col">Sharing Location</th>
					<th scope="col">Sharing WD Keys</th>
					<th scope="col">Squad</th>
				</tr>
			</thead>
			<tbody id="teamTable">
				<tr v-for="agent in team.agents" :key="agent.id">
					<td><img :src="agent.pic" height="50" width="50"></td>
						<td>{{ agent.name }}</td>
						<td><img v-if="agent.state" :src="window.wasabeewebui.cdnurl+'/mg/checkmark.png'" alt="sharing location"></td>
						<td><img v-if="agent.ShareWD" :src="window.wasabeewebui.cdnurl+'/img/checkmark.png'" alt="sharing wd keys"></td>
						<td>{{ agent.squad }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</div>
</template>


<script>
export default {
  props: ['team'],
}
</script>