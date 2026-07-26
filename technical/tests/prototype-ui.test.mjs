import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const shell = await readFile(new URL('technical/prototype-v2.html', root), 'utf8');
const modules = ['feed', 'rental', 'shop', 'profile'];
const pages = await Promise.all(modules.map(async name => ({
  name,
  html: await readFile(new URL(`technical/tabs/${name}.html`, root), 'utf8'),
})));
const sharedJs = await readFile(new URL('technical/shared/filmer-v3.js', root), 'utf8');

test('all prototype documents load the shared modern-silver assets', () => {
  for (const html of [shell, ...pages.map(page => page.html)]) {
    assert.match(html, /filmer-v3\.css/);
    assert.match(html, /filmer-v3\.js/);
  }
});

test('shell exposes five navigation slots with a labeled publish action', () => {
  for (const label of ['发现', '租赁', '发卷', '商城', '我的']) {
    assert.match(shell, new RegExp(label));
  }
  assert.doesNotMatch(shell, /class="fab"/);
});

test('feed publish flow exposes three explicit stages and one final action', () => {
  const feed = pages.find(page => page.name === 'feed').html;
  assert.equal((feed.match(/data-publish-stage=/g) || []).length, 3);
  assert.equal((feed.match(/data-final-publish/g) || []).length, 1);
});

test('transaction screens expose trust and film-spec information', () => {
  const rental = pages.find(page => page.name === 'rental').html;
  const shop = pages.find(page => page.name === 'shop').html;
  assert.match(rental, /data-rental-trust/);
  assert.match(shop, /data-film-specs/);
});

test('secondary screens report their state so the shell can hide global navigation', () => {
  assert.match(sharedJs, /filmer:screen/);
  assert.match(sharedJs, /postMessage/);
  assert.match(sharedJs, /event\.source !== activeFrame\.contentWindow/);
  assert.match(sharedJs, /screen-rental-home/);
  assert.match(sharedJs, /screen-shop-home/);
});

test('opening publish marks the center action active and shortcuts follow five slots', () => {
  assert.match(shell, /publish-tab[^\n]+classList\.add\('active'\)/);
  assert.match(shell, /function openPublish\(\)[\s\S]*?querySelectorAll\('\.tab-item'\)[^\n]+classList\.remove\('active'\)/);
  assert.match(sharedJs, /rootScreens\s*=\s*new Set\(\[[^\]]*'screen-publish'/);
  assert.match(shell, /e\.key === '3'\) openPublish\(\)/);
  assert.match(shell, /e\.key === '4'\) openTab\('shop'\)/);
  assert.match(shell, /e\.key === '5'\) openTab\('profile'\)/);
});

test('profile groups assets, transactions, and creator services', () => {
  const profile = pages.find(page => page.name === 'profile').html;
  assert.equal((profile.match(/data-profile-group=/g) || []).length, 3);
  for (const label of ['内容资产', '交易服务', '创作者服务']) {
    assert.match(profile, new RegExp(label));
  }
});

test('content detail links samples to shop, rental, and developing services', () => {
  const feed = pages.find(page => page.name === 'feed').html;
  assert.match(feed, /data-service-links/);
  assert.match(feed, /screen-product-detail/);
  assert.match(feed, /screen-camera-detail/);
  assert.match(feed, /screen-dev-shops/);
});
