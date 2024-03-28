var folderId;

document.addEventListener("DOMContentLoaded", function () {
  var getTimeButton = document.getElementById("get-time");
  var resultDiv = document.getElementById("result");

  chrome.bookmarks.search("VideosDeYouTube", (tree) => {
    const bookmarkList = document.getElementById('videos-list');
    folderId = tree[0].id;
    chrome.bookmarks.getChildren(folderId, (subtree) => {
      displayBookmarks(subtree, bookmarkList);
    })
  })

  getTimeButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      addBookmarkWithTime(tabs);
    });
  });
});

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  currentUrl = tabs[0].url;
  if (!isYouTubeVideo(currentUrl) && !isTwitchVideo(currentUrl)) {
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
  const urlPrefixes = [];
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    currentUrl = tabs[0].url;
    urlPrefix = baseUrl(currentUrl);
    i = 0;
    for (const node of nodes) {
      const tableRow = document.createElement('tr');
      const tableRowColumn1 = document.createElement('td');
      const tableRowColumn2 = document.createElement('td');
      const tableRowColumn3 = document.createElement('td');
      const hyperlink = document.createElement('a');
      hyperlink.href = node.url;
      hyperlink.textContent = node.title.substring(0, node.title.indexOf(' '));;
      tableRowColumn2.textContent = node.title.substring(node.title.indexOf(' ') + 3).slice(0, -9).trim();
      const removeButton = document.createElement('button');
      removeButton.textContent = "Remove";
      if (i < 10) {
        currentRemoveButtonId = "remove-time-0" + i;
      } else {
        currentRemoveButtonId = "remove-time-" + i;
      }
      removeButton.id = currentRemoveButtonId;
      tableRowColumn3.appendChild(removeButton);
      tableRowColumn1.appendChild(hyperlink);
      anUrlPrefix = baseUrl(node.url);
      if (urlPrefix == anUrlPrefix) {
        document.getElementById("get-time").style.display = "none";
        const updateButton = document.createElement('button');
        updateButton.textContent = "Update";
        updateButton.id = "update-time"
        tableRowColumn1.appendChild(updateButton);
        appendChilds(parentNode, tableRow, tableRowColumn1, tableRowColumn2, tableRowColumn3);
        var updateTimeButton = document.getElementById("update-time");
        updateTimeButton.addEventListener("click", function () {
          chrome.bookmarks.search({ query: urlPrefix }, (tree) => {
            updateBookmark(tabs, tree);
          });
        });
      } else {
        appendChilds(parentNode, tableRow, tableRowColumn1, tableRowColumn2, tableRowColumn3);
      }
      urlPrefixes[i] = anUrlPrefix;
      var removeBookmarkButton = document.getElementById(currentRemoveButtonId);
      removeBookmarkButton.addEventListener("click", function () {
        currentIndex = Number(this.id.slice(-2));
        chrome.bookmarks.search({ query: urlPrefixes[currentIndex] }, (results) => {
          for (const result of results) {
            if (baseUrl(result.url) == urlPrefixes[currentIndex]) {
              chrome.bookmarks.remove(result.id, () => { });
            }
          }
          location.reload();
        });
      });
      i += 1;
    }
  });
}

function appendChilds(parent, middle, child1, child2, child3) {
  middle.appendChild(child1);
  middle.appendChild(child2);
  middle.appendChild(child3);
  parent.appendChild(middle);
}

function isYouTubeVideo(url) {
  return url.substr(0, 32) == "https://www.youtube.com/watch?v=";
}

function isTwitchVideo(url) {
  return url.substr(0, 29) == "https://www.twitch.tv/videos/";
}

function baseUrl(url) {
  if (isYouTubeVideo(url)) {
    return url.substr(0, 43);
  } else {
    return url.substr(0, 39);
  }
}

function obtainSeconds(responseTime) {
  seconds = Math.floor(responseTime);
  if (seconds < 10) {
    seconds = 0;
  }
  return seconds;
}

function addTimeToUrl(url, seconds) {
  if (isYouTubeVideo(url)) {
    currentUrl = url.substr(0, 43) + "&t=" + seconds + "s";
  } else if (isTwitchVideo(url)) {
    currentUrl = url.substr(0, 39) + "?t=" + seconds + "s";
  }
  return currentUrl;
}

function addBookmarkWithTime(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, { action: "getVideoTime" }, function (response) {
    if (response && response.time) {
      numberOfSeconds = obtainSeconds(response.time);
      currentUrl = addTimeToUrl(tabs[0].url, numberOfSeconds);
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
}

function updateBookmark(tabs, tree) {
  chrome.tabs.sendMessage(tabs[0].id, { action: "getVideoTime" }, function (response) {
    if (response && response.time) {
      numberOfSeconds = obtainSeconds(response.time);
      currentUrl = addTimeToUrl(tabs[0].url, numberOfSeconds);
      chrome.bookmarks.update(tree[0].id,
        {
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
}