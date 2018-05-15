'use strict';

let historyTabs = [];

let getCurrentTab = function () {
	return new Promise((resolve, reject) => {
		chrome.windows.getLastFocused({}, function (window) {
			chrome.tabs.query({windowId: window.id, active: true}, function (tabs) {
				resolve((tabs.length > 0) ? tabs[0] : null);
			});
		});
	});
};

async function rememberCurrentTab() {
	let currentTab = await getCurrentTab();

	if (currentTab) {
		let contains = historyTabs.find(function (element) {
			return element.id === currentTab.id
		});

		if (!contains)
			historyTabs.push(currentTab);
	}

	while (historyTabs.length > 2)
		historyTabs.splice(0, 1);
}

async function closeCurrentTab() {
	let currentTab = await getCurrentTab();

	if (currentTab)
		closeTab(currentTab.id);
}

function closeTab(tabId) {
	chrome.tabs.remove(tabId);
}

function switchTabs() {
	if (historyTabs.length === 2) {
		let currentTab = historyTabs.pop();
		let lastTab = historyTabs.pop();

		console.log(`Switch between ${currentTab} and ${lastTab}`);

		historyTabs.push(currentTab);

		chrome.tabs.update(lastTab.id, {active: true}, function () {
			chrome.windows.update(lastTab.windowId, {focused: true});
		});
	}
}

chrome.commands.onCommand.addListener(function (command) {
	console.log(command);
	switch (command) {
		case "tab-close":
			closeCurrentTab();
			break;

		case "tab-switch":
			switchTabs();
			break;
	}
});

chrome.tabs.onActivated.addListener(async function (activeInfo) {
	await rememberCurrentTab();
});

chrome.windows.onFocusChanged.addListener(async function (windowId) {
	await rememberCurrentTab();
});

(async function () {
	await rememberCurrentTab();
})();

// setInterval(function () {
// 	let s = "";
// 	for (let i = 0; i < historyTabs.length; i++)
// 		s += historyTabs[i].id + " ";
// 	console.log(s);
// }, 500);
