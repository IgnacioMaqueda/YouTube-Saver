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

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  currentUrl = tabs[0].url.substr(0, 32);
  if (currentUrl != "https://www.youtube.com/watch?v=") {
    document.getElementById("get-time").style.display = "none";
  }
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
    const tableRow = document.createElement('tr');
    const tableRowColumn1 = document.createElement('td');
    const tableRowColumn2 = document.createElement('td');
    const hyperlink = document.createElement('a');
    hyperlink.href = node.url;
    hyperlink.textContent = node.title.substring(0, node.title.indexOf(' '));;
    tableRowColumn2.textContent = node.title.substring(node.title.indexOf(' ') + 3).slice(0, -10);
    tableRowColumn1.appendChild(hyperlink);
    tableRow.appendChild(tableRowColumn1);
    tableRow.appendChild(tableRowColumn2);
    parentNode.appendChild(tableRow);
  }
}