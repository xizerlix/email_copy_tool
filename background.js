
let globalLastEmail = "";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Email Copy Tool: The extension is installed and ready to use.");
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_LAST_COPIED") {
    sendResponse({ lastEmail: globalLastEmail });
  }
  if (request.type === "SET_LAST_COPIED") {
    globalLastEmail = request.email;
  }
});