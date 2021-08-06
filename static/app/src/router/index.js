import Vue from "vue";
import VueRouter from "vue-router";
import Teams from "../views/Teams.vue";

import Operations from "../views/Operations.vue";
import Settings from "../views/Settings.vue";
import Help from "../views/Help.vue";

import Operation from "../views/Operation.vue";
import OperationChecklist from "../views/OperationChecklist.vue";
import OperationMap from "../views/OperationMap.vue";
import OperationKeys from "../views/OperationKeys.vue";
import OperationManage from "../views/OperationManage.vue";
import OperationPermissions from "../views/OperationPermissions.vue";

import Team from "../views/Team.vue";
import TeamList from "../views/TeamList.vue";
import TeamAgentMap from "../views/TeamAgentMap.vue";
import TeamManage from "../views/TeamManage.vue";
import TeamSettings from "../views/TeamSettings.vue";

import DefensiveKeys from "../views/DefensiveKeys.vue";

Vue.use(VueRouter);

const routes = [
  { path: "/", redirect: "teams" },
  {
    path: "/teams",
    name: "Teams",
    component: Teams,
  },
  {
    path: "/operations",
    name: "Operations",
    component: Operations,
  },
  {
    path: "/defensivekeys",
    name: "Defensive Keys",
    component: DefensiveKeys,
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings,
  },
  {
    path: "/help",
    name: "Help",
    component: Help,
  },
  {
    path: "/operation/:id",
    name: "Operation",
    component: Operation,
    props: true,
    children: [
      { path: "", redirect: "list" },
      { path: "list", component: OperationChecklist },
      {
        path: "assignments",
        component: OperationChecklist,
        props: { assignmentsOnly: true },
      },
      { path: "map", component: OperationMap },
      { path: "keys", component: OperationKeys },
      { path: "manage", component: OperationManage },
      { path: "permissions", component: OperationPermissions },
    ],
  },
  {
    path: "/team/:id",
    name: "Team",
    component: Team,
    props: true,
    children: [
      { path: "", redirect: "list" },
      { path: "list", component: TeamList },
      { path: "map", component: TeamAgentMap },
      { path: "manage", component: TeamManage },
      { path: "Settings", component: TeamSettings },
    ],
  },
];

const router = new VueRouter({
  routes,
  linkActiveClass: "active",
});

export default router;
