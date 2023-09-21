document.addEventListener("DOMContentLoaded", function () {
  var getTimeButton = document.getElementById("get-time");
  var resultDiv = document.getElementById("result");
  var folderId = 1;

  chrome.bookmarks.search("VideosDeYouTube", (tree) => {
    const bookmarkList = document.getElementById('videos-list');
    folderId = tree[0].id;
    chrome.bookmarks.getChildren(folderId, (subtree) => {
      displayBookmarks(subtree, bookmarkList);
    })
  })

  getTimeButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      currentUrl = tabs[0].url.substr(0, 43);
      chrome.tabs.sendMessage(tabs[0].id, { action: "getVideoTime" }, function (response) {
        if (response && response.time) {
          numberOfSeconds = Math.floor(response.time);
          currentUrl = currentUrl + "&t=" + numberOfSeconds + "s";
          chrome.bookmarks.create(
            {
              parentId: folderId,
              title: secondsToHHmmss(numberOfSeconds) + " - " + tabs[0].title,
              url: currentUrl
            },
            () => {
              location.reload();
            }
          );
        } else {
          resultDiv.textContent = "Failed to get the video time.";
        }
      });

    });
  });
});


function secondsToHHmmss(seconds) {
  var hours = Math.floor(seconds / 3600).toString();
  seconds %= 3600;

  var minutes = Math.floor(seconds / 60).toString();
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  seconds %= 60;

  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  
  return hours + ":" + minutes + ":" + seconds;
}


function displayBookmarks(nodes, parentNode) {
  for (const node of nodes) {
    const listItem = document.createElement('li');
    listItem.textContent = node.title;
    parentNode.appendChild(listItem);
  }
}