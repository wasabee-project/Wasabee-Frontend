<template>
  <div id="app">
    <b-navbar toggleable="lg">
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item to="/teams">Teams</b-nav-item>
          <b-nav-item to="/operations">Operations</b-nav-item>
          <b-nav-item to="/settings">Settings</b-nav-item>
          <b-nav-item to="/help">Help</b-nav-item>
          <b-nav-item href="/logout">Log out</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <div id="wasabeeAlerts"></div>
    <router-view />
  </div>
</template>
