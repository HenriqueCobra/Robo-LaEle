/*
 * Service worker do Robo-LaEle: badge por aba, recordes e mensagens.
 *
 * formatCompact é uma função pura. Fica exposta em self.LaEleBadge.formatCompact
 * (no navegador) e em module.exports (em Node, para os testes).
 */
'use strict';

var BADGE_COLOR = '#FFE45C';
var BADGE_TEXT_COLOR = '#17141f';

if (typeof importScripts === 'function') {
  ['../shared/dictionary.js', '../shared/engine.js', '../shared/storage.js'].forEach(function (file) {
    try {
      importScripts(file);
    } catch (err) {
      // arquivo ausente ou com erro: o worker segue de pé
    }
  });
}

var swLaEle = globalThis.LaEle = globalThis.LaEle || {};
if (!swLaEle.storage && typeof module !== 'undefined' && module.exports && typeof require === 'function') {
  try {
    swLaEle.storage = require('../shared/storage.js');
  } catch (err) {
    // sem storage em Node: só formatCompact fica disponível
  }
}

// ---------- formatação compacta ----------

// 950 -> "950", 1234 -> "1.2k", 12345 -> "12k", 1234567 -> "1.2M". Sempre trunca, nunca arredonda para cima.
function formatCompact(value) {
  var n = Math.floor(Number(value));
  if (!isFinite(n) || n <= 0) return '0';
  if (n < 1000) return String(n);
  var units = [
    { size: 1e9, suffix: 'B' },
    { size: 1e6, suffix: 'M' },
    { size: 1e3, suffix: 'k' }
  ];
  for (var i = 0; i < units.length; i++) {
    var u = units[i];
    if (n >= u.size) {
      var scaled = n / u.size;
      if (scaled < 10) {
        var tenths = Math.floor(scaled * 10) / 10;
        return String(tenths) + u.suffix;
      }
      return String(Math.floor(scaled)) + u.suffix;
    }
  }
  return String(n);
}

globalThis.LaEleBadge = { formatCompact: formatCompact };

// ---------- badge ----------

function hasChrome() {
  return typeof chrome !== 'undefined' && chrome.action;
}

function swallow(promiseLike) {
  if (promiseLike && typeof promiseLike.catch === 'function') promiseLike.catch(function () {});
}

function applyBadgeStyle(tabId) {
  if (!hasChrome()) return;
  try {
    var bg = { color: BADGE_COLOR };
    var fg = { color: BADGE_TEXT_COLOR };
    if (tabId !== undefined) { bg.tabId = tabId; fg.tabId = tabId; }
    swallow(chrome.action.setBadgeBackgroundColor(bg));
    if (chrome.action.setBadgeTextColor) swallow(chrome.action.setBadgeTextColor(fg));
  } catch (err) { /* aba pode já ter sido fechada */ }
}

function setBadge(tabId, text) {
  if (!hasChrome() || tabId === undefined || tabId === null) return;
  try {
    applyBadgeStyle(tabId);
    swallow(chrome.action.setBadgeText({ tabId: tabId, text: text }));
  } catch (err) { /* aba pode já ter sido fechada */ }
}

function badgeTextFor(total) {
  return Number(total) > 0 ? formatCompact(total) : '';
}

// ---------- mensagens ----------

function broadcastUpdated(tabId, summary) {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) return;
  try {
    var p = chrome.runtime.sendMessage({ type: 'LAELE_UPDATED', tabId: tabId, summary: summary });
    // "Receiving end does not exist" quando o popup está fechado: ignorado
    if (p && typeof p.catch === 'function') p.catch(function () {});
  } catch (err) { /* sem ouvintes */ }
}

function handleProgress(message, sender) {
  var tabId = sender && sender.tab ? sender.tab.id : undefined;
  setBadge(tabId, badgeTextFor(message && message.total));
}

function handleResult(message, sender) {
  var tabId = sender && sender.tab ? sender.tab.id : undefined;
  var summary = message && message.summary;
  var entryIds = (message && message.entryIds) || [];
  var phrases = message && Array.isArray(message.phrases) ? message.phrases : [];
  var storage = swLaEle.storage;
  var fallback = { newGlobalBest: false, newSiteBest: false, newTopPhrase: false };

  if (!summary || !storage) return Promise.resolve(fallback);

  var saveTab = tabId !== undefined
    ? storage.setTabSummary(tabId, summary).catch(function () {})
    : Promise.resolve();

  return saveTab
    .then(function () { return storage.recordScan(summary, entryIds, phrases); })
    .then(function (result) {
      setBadge(tabId, badgeTextFor(summary.total));
      broadcastUpdated(tabId, summary);
      return result;
    })
    .catch(function () { return fallback; });
}

function onMessage(message, sender, sendResponse) {
  if (!message || typeof message.type !== 'string') return false;

  if (message.type === 'LAELE_PROGRESS') {
    handleProgress(message, sender);
    return false;
  }

  if (message.type === 'LAELE_RESULT') {
    handleResult(message, sender).then(sendResponse);
    return true; // resposta assíncrona
  }

  return false;
}

// ---------- ciclo de vida das abas ----------

function clearTab(tabId) {
  setBadge(tabId, '');
  var storage = swLaEle.storage;
  if (storage && storage.removeTabSummary) {
    storage.removeTabSummary(tabId).catch(function () {});
  }
}

function onTabUpdated(tabId, changeInfo) {
  if (changeInfo && changeInfo.status === 'loading' && changeInfo.url) clearTab(tabId);
}

function onTabRemoved(tabId) {
  var storage = swLaEle.storage;
  if (storage && storage.removeTabSummary) {
    storage.removeTabSummary(tabId).catch(function () {});
  }
}

function onInstalled() {
  applyBadgeStyle();
  var storage = swLaEle.storage;
  if (storage) {
    // grava os padrões sem sobrescrever o que o usuário já configurou
    storage.saveSettings({}).catch(function () {});
  }
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(onMessage);
  if (chrome.runtime.onInstalled) chrome.runtime.onInstalled.addListener(onInstalled);
  if (chrome.tabs) {
    if (chrome.tabs.onUpdated) chrome.tabs.onUpdated.addListener(onTabUpdated);
    if (chrome.tabs.onRemoved) chrome.tabs.onRemoved.addListener(onTabRemoved);
  }
  applyBadgeStyle();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatCompact: formatCompact,
    handleProgress: handleProgress,
    handleResult: handleResult,
    onMessage: onMessage,
    onTabUpdated: onTabUpdated,
    onTabRemoved: onTabRemoved,
    onInstalled: onInstalled
  };
}
