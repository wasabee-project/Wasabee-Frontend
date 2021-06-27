<template>
  <div id="wasabeeContent">
    <div class="container">
      <div class="row">
        <div class="col">
          <h1>Help</h1>
          <div class="content-area">
            <div class="card mb-2">
              <div class="card-header">Wasabee IITC Plugin</div>
              <div class="card-body">
                <div>
                  Stable Release:
                  <a
                    href="https://cdn2.wasabee.rocks/iitcplugin/prod/wasabee.user.js"
                    >https://cdn2.wasabee.rocks/iitcplugin/prod/wasabee.user.js</a
                  >
                  <span class="dim small"
                    >This is the supported version that has been tested</span
                  >
                </div>
                <div>
                  Development Build:
                  <a href="https://am.wasabee.rocks/static/dev/wasabee.user.js"
                    >https://am.wasabee.rocks/static/dev/wasabee.user.js</a
                  >
                  <span class="dim small"
                    >This is the current work-in-progress version which may
                    contain bugs</span
                  >
                </div>
                <div>
                  IITC-Android Install Instructions:
                  <a href="https://enl.rocks/-NaqC">https://enl.rocks/-NaqC</a>
                  <span class="dim small"
                    >Instructions for installing on IITC-Android</span
                  >
                </div>
              </div>
            </div>

            <div class="card mb-2">
              <div class="card-header">Videos and How-Tos</div>
              <div class="card-body">
                <div>
                  <a
                    href="https://www.youtube.com/playlist?list=PLyku9nmtwrADKQM9_EZk7NYbZXVOrBhXa"
                    >YouTube Playlist</a
                  >
                </div>
              </div>
            </div>

            <div class="card mb-2">
              <div class="card-header">Chats</div>
              <div class="card-body">
                <div><a href="https://enl.rocks/-dEHQ">Main Chat</a></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// avoid noise in produce html
export default {
  props: ["me"],
};
</script>
