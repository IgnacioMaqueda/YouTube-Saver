chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getVideoTime") {
    var player = document.querySelector("video");
    if (player) {
      sendResponse({ time: player.currentTime });
    } else {
      sendResponse({ error: "Video player not found." });
    }
  }
});
